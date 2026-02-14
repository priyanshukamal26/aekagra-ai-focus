import { Router } from "express";
import db from "../db.js";
import { authenticateToken } from "../middleware/auth.js";

const router = Router();
router.use(authenticateToken);

// ── GET /api/dashboard/stats ───────────────────────────────────────

router.get("/stats", (req, res) => {
    try {
        const userId = req.user.id;
        const today = new Date().toISOString().split("T")[0];

        // Today's average focus score
        const focusResult = db.prepare(`
            SELECT COALESCE(ROUND(AVG(focus_score), 0), 0) as score
            FROM focus_sessions
            WHERE user_id = ? AND status = 'completed' AND DATE(started_at) = ?
        `).get(userId, today);

        // Today's study hours
        const hoursResult = db.prepare(`
            SELECT COALESCE(SUM(duration_seconds), 0) as total_seconds
            FROM focus_sessions
            WHERE user_id = ? AND status = 'completed' AND DATE(started_at) = ?
        `).get(userId, today);

        // Current streak
        const activities = db.prepare(`
            SELECT date FROM daily_activity
            WHERE user_id = ? ORDER BY date DESC LIMIT 60
        `).all(userId);

        let currentStreak = 0;
        const todayDate = new Date();
        for (let i = 0; i < activities.length; i++) {
            const expected = new Date(todayDate);
            expected.setDate(expected.getDate() - i);
            const expectedStr = expected.toISOString().split("T")[0];
            if (activities[i].date === expectedStr) {
                currentStreak++;
            } else {
                break;
            }
        }

        // Today's task completion
        const tasksResult = db.prepare(`
            SELECT
                COUNT(*) as total,
                SUM(CASE WHEN is_completed = 1 THEN 1 ELSE 0 END) as done
            FROM study_tasks
            WHERE user_id = ? AND (due_date = ? OR DATE(completed_at) = ?)
        `).get(userId, today, today);

        res.json({
            stats: {
                focusScore: { value: `${focusResult.score}%`, change: "" },
                studyHours: { value: `${(hoursResult.total_seconds / 3600).toFixed(1)}h`, change: "" },
                dayStreak: { value: `${currentStreak}`, change: "" },
                tasksDone: {
                    value: `${tasksResult.done || 0}/${tasksResult.total || 0}`,
                    change: tasksResult.total > 0 ? `${Math.round(((tasksResult.done || 0) / tasksResult.total) * 100)}%` : "0%",
                },
            },
        });
    } catch (err) {
        console.error("Dashboard stats error:", err);
        res.status(500).json({ error: "Failed to fetch dashboard stats" });
    }
});

// ── GET /api/dashboard/upcoming ────────────────────────────────────

router.get("/upcoming", (req, res) => {
    try {
        const limit = Math.min(10, Math.max(1, parseInt(req.query.limit) || 5));

        const tasks = db.prepare(`
            SELECT st.*, sw.week_number, sp.title as plan_title
            FROM study_tasks st
            JOIN study_weeks sw ON st.week_id = sw.id
            JOIN study_plans sp ON sw.plan_id = sp.id
            WHERE st.user_id = ? AND st.is_completed = 0
            ORDER BY
                CASE WHEN st.due_date IS NULL THEN 1 ELSE 0 END,
                st.due_date ASC,
                st.id ASC
            LIMIT ?
        `).all(req.user.id, limit);

        res.json({ tasks });
    } catch (err) {
        console.error("Dashboard upcoming error:", err);
        res.status(500).json({ error: "Failed to fetch upcoming tasks" });
    }
});

export default router;
