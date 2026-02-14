import { Router } from "express";
import db from "../db.js";
import { authenticateToken } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { z } from "zod";
import { generatePlan } from "../services/llm.js";
import { generatePlan as generatePlanOllama } from "../services/ollama.js";

const router = Router();
router.use(authenticateToken);

// ── Schemas ────────────────────────────────────────────────────────

const createPlanSchema = z.object({
    title: z.string().min(1, "Title is required").max(200),
    syllabus_text: z.string().optional().default(""),
    // Optional: override generated weeks if needed, but primary flow is AI
    weeks: z.array(z.object({
        week_number: z.number().int().positive(),
        topics: z.array(z.string()).default([]),
        tasks: z.array(z.object({
            title: z.string().min(1),
            due_date: z.string().optional(),
        })).default([]),
    })).optional().default([]),
});

const toggleTaskSchema = z.object({
    is_completed: z.boolean(),
});

// ── POST /api/planner/plans ────────────────────────────────────────

router.post("/plans", validate(createPlanSchema), async (req, res) => {
    try {
        const { title, syllabus_text } = req.body;
        let { weeks } = req.body;

        // If no weeks provided but syllabus is, generate plan using AI
        if (weeks.length === 0 && syllabus_text) {
            try {
                // Get user preferences
                const profile = db.prepare("SELECT preferences FROM user_profiles WHERE user_id = ?").get(req.user.id);
                const prefs = profile?.preferences ? JSON.parse(profile.preferences) : {};
                const provider = prefs.aiProvider || "gemini";
                const model = prefs.ollamaModel || "llama3";

                let generated;
                if (provider === "ollama") {
                    generated = await generatePlanOllama(syllabus_text, model);
                } else {
                    generated = await generatePlan(syllabus_text);
                }

                weeks = generated.weeks || [];
            } catch (aiError) {
                console.error("AI Plan Generation failed:", aiError);
                // Fallback to empty weeks if AI fails
            }
        }

        const planResult = db.prepare(
            "INSERT INTO study_plans (user_id, title, syllabus_text) VALUES (?, ?, ?)"
        ).run(req.user.id, title, syllabus_text);

        const planId = planResult.lastInsertRowid;

        // Insert weeks and tasks
        const insertWeek = db.prepare(
            "INSERT INTO study_weeks (plan_id, week_number, topics) VALUES (?, ?, ?)"
        );
        const insertTask = db.prepare(
            "INSERT INTO study_tasks (week_id, user_id, title, due_date) VALUES (?, ?, ?, ?)"
        );

        const insertAll = db.transaction(() => {
            for (const week of weeks) {
                const weekResult = insertWeek.run(planId, week.week_number, JSON.stringify(week.topics));
                for (const task of week.tasks) {
                    insertTask.run(weekResult.lastInsertRowid, req.user.id, task.title, task.due_date || null);
                }
            }
        });

        insertAll();

        // Return the created plan with nested data
        const plan = getPlanWithDetails(planId, req.user.id);
        res.status(201).json({ plan });
    } catch (err) {
        console.error("Create plan error:", err);
        res.status(500).json({ error: "Failed to create plan" });
    }
});

// ── GET /api/planner/plans ─────────────────────────────────────────

router.get("/plans", (req, res) => {
    try {
        const plans = db.prepare(
            "SELECT * FROM study_plans WHERE user_id = ? ORDER BY created_at DESC"
        ).all(req.user.id);

        // Attach summary counts
        const enriched = plans.map(plan => {
            const totalTasks = db.prepare(`
                SELECT COUNT(*) as count FROM study_tasks st
                JOIN study_weeks sw ON st.week_id = sw.id
                WHERE sw.plan_id = ? AND st.user_id = ?
            `).get(plan.id, req.user.id).count;

            const completedTasks = db.prepare(`
                SELECT COUNT(*) as count FROM study_tasks st
                JOIN study_weeks sw ON st.week_id = sw.id
                WHERE sw.plan_id = ? AND st.user_id = ? AND st.is_completed = 1
            `).get(plan.id, req.user.id).count;

            return { ...plan, totalTasks, completedTasks };
        });

        res.json({ plans: enriched });
    } catch (err) {
        console.error("List plans error:", err);
        res.status(500).json({ error: "Failed to fetch plans" });
    }
});

// ── GET /api/planner/plans/:id ─────────────────────────────────────

router.get("/plans/:id", (req, res) => {
    try {
        const plan = getPlanWithDetails(req.params.id, req.user.id);
        if (!plan) {
            return res.status(404).json({ error: "Plan not found" });
        }
        res.json({ plan });
    } catch (err) {
        console.error("Get plan error:", err);
        res.status(500).json({ error: "Failed to fetch plan" });
    }
});

// ── PATCH /api/planner/tasks/:id ───────────────────────────────────

router.patch("/tasks/:id", validate(toggleTaskSchema), (req, res) => {
    try {
        const task = db.prepare(
            "SELECT * FROM study_tasks WHERE id = ? AND user_id = ?"
        ).get(req.params.id, req.user.id);

        if (!task) {
            return res.status(404).json({ error: "Task not found" });
        }

        const completedAt = req.body.is_completed ? new Date().toISOString() : null;
        db.prepare(
            "UPDATE study_tasks SET is_completed = ?, completed_at = ? WHERE id = ?"
        ).run(req.body.is_completed ? 1 : 0, completedAt, task.id);

        // Update daily activity if completing
        if (req.body.is_completed) {
            const today = new Date().toISOString().split("T")[0];
            const existing = db.prepare(
                "SELECT * FROM daily_activity WHERE user_id = ? AND date = ?"
            ).get(req.user.id, today);

            if (existing) {
                db.prepare(
                    "UPDATE daily_activity SET tasks_completed = tasks_completed + 1 WHERE id = ?"
                ).run(existing.id);
            } else {
                db.prepare(
                    "INSERT INTO daily_activity (user_id, date, tasks_completed) VALUES (?, ?, 1)"
                ).run(req.user.id, today);
            }
        }

        const updated = db.prepare("SELECT * FROM study_tasks WHERE id = ?").get(task.id);
        res.json({ task: updated });
    } catch (err) {
        console.error("Toggle task error:", err);
        res.status(500).json({ error: "Failed to update task" });
    }
});

// ── DELETE /api/planner/plans/:id ──────────────────────────────────

router.delete("/plans/:id", (req, res) => {
    try {
        const plan = db.prepare(
            "SELECT * FROM study_plans WHERE id = ? AND user_id = ?"
        ).get(req.params.id, req.user.id);

        if (!plan) {
            return res.status(404).json({ error: "Plan not found" });
        }

        // CASCADE will handle weeks and tasks
        db.prepare("DELETE FROM study_plans WHERE id = ?").run(plan.id);
        res.json({ message: "Plan deleted" });
    } catch (err) {
        console.error("Delete plan error:", err);
        res.status(500).json({ error: "Failed to delete plan" });
    }
});

// ── Helper ─────────────────────────────────────────────────────────

function getPlanWithDetails(planId, userId) {
    const plan = db.prepare(
        "SELECT * FROM study_plans WHERE id = ? AND user_id = ?"
    ).get(planId, userId);

    if (!plan) return null;

    const weeks = db.prepare(
        "SELECT * FROM study_weeks WHERE plan_id = ? ORDER BY week_number"
    ).all(plan.id);

    plan.weeks = weeks.map(week => {
        const tasks = db.prepare(
            "SELECT * FROM study_tasks WHERE week_id = ? ORDER BY id"
        ).all(week.id);
        return {
            ...week,
            topics: JSON.parse(week.topics || "[]"),
            tasks,
        };
    });

    return plan;
}

export default router;
