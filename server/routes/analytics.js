import { Router } from "express";
import db from "../db.js";
import { authenticateToken } from "../middleware/auth.js";

const router = Router();
router.use(authenticateToken);

// ── GET /api/analytics/summary ─────────────────────────────────────

router.get("/summary", (req, res) => {
    try {
        const userId = req.user.id;

        // Average focus score (last 30 days)
        const avgResult = db.prepare(`
            SELECT COALESCE(ROUND(AVG(focus_score), 1), 0) as avg_score
            FROM focus_sessions
            WHERE user_id = ? AND status = 'completed'
              AND started_at >= datetime('now', '-30 days')
        `).get(userId);

        // Total study hours (last 30 days)
        const hoursResult = db.prepare(`
            SELECT COALESCE(SUM(duration_seconds), 0) as total_seconds
            FROM focus_sessions
            WHERE user_id = ? AND status = 'completed'
              AND started_at >= datetime('now', '-30 days')
        `).get(userId);

        // Current streak (consecutive days with activity)
        const activities = db.prepare(`
            SELECT date FROM daily_activity
            WHERE user_id = ? ORDER BY date DESC
        `).all(userId);

        let currentStreak = 0;
        const today = new Date();
        for (let i = 0; i < activities.length; i++) {
            const expected = new Date(today);
            expected.setDate(expected.getDate() - i);
            const expectedStr = expected.toISOString().split("T")[0];
            if (activities[i].date === expectedStr) {
                currentStreak++;
            } else {
                break;
            }
        }

        // Longest streak
        let longestStreak = 0;
        let tempStreak = 0;
        for (let i = 0; i < activities.length; i++) {
            if (i === 0) {
                tempStreak = 1;
            } else {
                const curr = new Date(activities[i].date);
                const prev = new Date(activities[i - 1].date);
                const diffDays = (prev - curr) / (1000 * 60 * 60 * 24);
                if (diffDays === 1) {
                    tempStreak++;
                } else {
                    tempStreak = 1;
                }
            }
            longestStreak = Math.max(longestStreak, tempStreak);
        }

        // Total distractions (last 30 days)
        const distractions = db.prepare(`
            SELECT COUNT(*) as count FROM focus_events fe
            JOIN focus_sessions fs ON fe.session_id = fs.id
            WHERE fs.user_id = ? AND fe.event_type IN ('face_lost','eyes_away','tab_switch','idle')
              AND fe.timestamp >= datetime('now', '-30 days')
        `).get(userId);

        res.json({
            summary: {
                weeklyAverage: `${avgResult.avg_score}%`,
                totalHours: `${(hoursResult.total_seconds / 3600).toFixed(1)}h`,
                currentStreak: `${currentStreak} days`,
                longestStreak: `${longestStreak} days`,
                distractions: distractions.count,
            },
        });
    } catch (err) {
        console.error("Analytics summary error:", err);
        res.status(500).json({ error: "Failed to fetch analytics summary" });
    }
});

// ── GET /api/analytics/focus-trend ─────────────────────────────────

router.get("/focus-trend", (req, res) => {
    try {
        const days = Math.min(90, Math.max(1, parseInt(req.query.days) || 7));
        const userId = req.user.id;

        const trend = db.prepare(`
            SELECT
                DATE(started_at) as date,
                ROUND(AVG(focus_score), 1) as avg_score,
                COUNT(*) as sessions,
                SUM(duration_seconds) as total_seconds
            FROM focus_sessions
            WHERE user_id = ? AND status = 'completed'
              AND started_at >= datetime('now', '-' || ? || ' days')
            GROUP BY DATE(started_at)
            ORDER BY date ASC
        `).all(userId, days);

        res.json({ trend, days });
    } catch (err) {
        console.error("Focus trend error:", err);
        res.status(500).json({ error: "Failed to fetch focus trend" });
    }
});

// ── GET /api/analytics/subject-distribution ────────────────────────

router.get("/subject-distribution", (req, res) => {
    try {
        const subjects = db.prepare(
            "SELECT * FROM user_subjects WHERE user_id = ? ORDER BY total_minutes DESC"
        ).all(req.user.id);

        const totalMinutes = subjects.reduce((sum, s) => sum + s.total_minutes, 0);
        const distribution = subjects.map(s => ({
            ...s,
            percent: totalMinutes > 0 ? Math.round((s.total_minutes / totalMinutes) * 100) : 0,
        }));

        res.json({ subjects: distribution, totalMinutes });
    } catch (err) {
        console.error("Subject distribution error:", err);
        res.status(500).json({ error: "Failed to fetch subject distribution" });
    }
});

export default router;
