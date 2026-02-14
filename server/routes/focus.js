import { Router } from "express";
import db from "../db.js";
import { authenticateToken } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { z } from "zod";

const router = Router();

// All focus routes require authentication
router.use(authenticateToken);

// ── Schemas ────────────────────────────────────────────────────────

const eventSchema = z.object({
    event_type: z.enum([
        "face_detected", "face_lost",
        "eyes_away", "eyes_back",
        "tab_switch", "tab_return",
        "idle", "active",
    ]),
    metadata: z.record(z.unknown()).optional().default({}),
});

// ── POST /api/focus/start ──────────────────────────────────────────

router.post("/start", (req, res) => {
    try {
        // Abandon any existing active sessions for this user
        db.prepare(
            "UPDATE focus_sessions SET status = 'abandoned', ended_at = CURRENT_TIMESTAMP WHERE user_id = ? AND status = 'active'"
        ).run(req.user.id);

        const result = db.prepare(
            "INSERT INTO focus_sessions (user_id) VALUES (?)"
        ).run(req.user.id);

        const session = db.prepare(
            "SELECT * FROM focus_sessions WHERE id = ?"
        ).get(result.lastInsertRowid);

        res.status(201).json({ session });
    } catch (err) {
        console.error("Focus start error:", err);
        res.status(500).json({ error: "Failed to start session" });
    }
});

// ── POST /api/focus/:id/event ──────────────────────────────────────

router.post("/:id/event", validate(eventSchema), (req, res) => {
    try {
        const session = db.prepare(
            "SELECT * FROM focus_sessions WHERE id = ? AND user_id = ?"
        ).get(req.params.id, req.user.id);

        if (!session) {
            return res.status(404).json({ error: "Session not found" });
        }
        if (session.status !== "active") {
            return res.status(400).json({ error: "Session is not active" });
        }

        const { event_type, metadata } = req.body;
        const result = db.prepare(
            "INSERT INTO focus_events (session_id, event_type, metadata) VALUES (?, ?, ?)"
        ).run(session.id, event_type, JSON.stringify(metadata));

        res.status(201).json({
            event: { id: result.lastInsertRowid, session_id: session.id, event_type },
        });
    } catch (err) {
        console.error("Focus event error:", err);
        res.status(500).json({ error: "Failed to log event" });
    }
});

// ── PATCH /api/focus/:id/end ───────────────────────────────────────

router.patch("/:id/end", (req, res) => {
    try {
        const session = db.prepare(
            "SELECT * FROM focus_sessions WHERE id = ? AND user_id = ?"
        ).get(req.params.id, req.user.id);

        if (!session) {
            return res.status(404).json({ error: "Session not found" });
        }
        if (session.status !== "active") {
            return res.status(400).json({ error: "Session is not active" });
        }

        // Calculate duration
        const startedAt = new Date(session.started_at).getTime();
        const now = Date.now();
        const durationSeconds = Math.round((now - startedAt) / 1000);

        // Calculate focus score from events
        const events = db.prepare(
            "SELECT * FROM focus_events WHERE session_id = ? ORDER BY timestamp"
        ).all(session.id);

        let focusScore = 100;
        const negativeEvents = events.filter(e =>
            ["face_lost", "eyes_away", "tab_switch", "idle"].includes(e.event_type)
        );
        // Simple scoring: deduct points per distraction, minimum 0
        focusScore = Math.max(0, 100 - negativeEvents.length * 5);

        db.prepare(
            "UPDATE focus_sessions SET status = 'completed', ended_at = CURRENT_TIMESTAMP, duration_seconds = ?, focus_score = ? WHERE id = ?"
        ).run(durationSeconds, focusScore, session.id);

        // Update daily activity
        const today = new Date().toISOString().split("T")[0];
        const existing = db.prepare(
            "SELECT * FROM daily_activity WHERE user_id = ? AND date = ?"
        ).get(req.user.id, today);

        if (existing) {
            db.prepare(
                "UPDATE daily_activity SET total_focus_minutes = total_focus_minutes + ?, sessions_count = sessions_count + 1 WHERE id = ?"
            ).run(Math.round(durationSeconds / 60), existing.id);
        } else {
            db.prepare(
                "INSERT INTO daily_activity (user_id, date, total_focus_minutes, sessions_count) VALUES (?, ?, ?, 1)"
            ).run(req.user.id, today, Math.round(durationSeconds / 60));
        }

        const updated = db.prepare(
            "SELECT * FROM focus_sessions WHERE id = ?"
        ).get(session.id);

        res.json({ session: updated });
    } catch (err) {
        console.error("Focus end error:", err);
        res.status(500).json({ error: "Failed to end session" });
    }
});

// ── GET /api/focus/history ─────────────────────────────────────────

router.get("/history", (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
        const offset = (page - 1) * limit;

        const sessions = db.prepare(
            "SELECT * FROM focus_sessions WHERE user_id = ? ORDER BY started_at DESC LIMIT ? OFFSET ?"
        ).all(req.user.id, limit, offset);

        const total = db.prepare(
            "SELECT COUNT(*) as count FROM focus_sessions WHERE user_id = ?"
        ).get(req.user.id).count;

        res.json({ sessions, total, page, limit });
    } catch (err) {
        console.error("Focus history error:", err);
        res.status(500).json({ error: "Failed to fetch history" });
    }
});

// ── GET /api/focus/active ──────────────────────────────────────────

router.get("/active", (req, res) => {
    try {
        const session = db.prepare(
            "SELECT * FROM focus_sessions WHERE user_id = ? AND status = 'active' ORDER BY started_at DESC LIMIT 1"
        ).get(req.user.id);

        res.json({ session: session || null });
    } catch (err) {
        console.error("Focus active error:", err);
        res.status(500).json({ error: "Failed to fetch active session" });
    }
});

export default router;
