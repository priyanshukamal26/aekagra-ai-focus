import { Router } from "express";
import bcrypt from "bcryptjs";
import db from "../db.js";
import { authenticateToken } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { z } from "zod";

const router = Router();
router.use(authenticateToken);

// ── Schemas ────────────────────────────────────────────────────────

const updateProfileSchema = z.object({
    display_name: z.string().max(100).optional(),
    avatar_url: z.string().url().optional().nullable(),
    timezone: z.string().max(50).optional(),
    preferences: z.record(z.unknown()).optional(),
});

const changePasswordSchema = z.object({
    current_password: z.string().min(1, "Current password is required"),
    new_password: z.string().min(6, "New password must be at least 6 characters"),
});

// ── GET /api/user/profile ──────────────────────────────────────────

router.get("/profile", (req, res) => {
    try {
        const user = db.prepare(
            "SELECT id, email, created_at FROM users WHERE id = ?"
        ).get(req.user.id);

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // Get or create profile
        let profile = db.prepare(
            "SELECT * FROM user_profiles WHERE user_id = ?"
        ).get(req.user.id);

        if (!profile) {
            db.prepare(
                "INSERT INTO user_profiles (user_id, display_name) VALUES (?, ?)"
            ).run(req.user.id, user.email.split("@")[0]);

            profile = db.prepare(
                "SELECT * FROM user_profiles WHERE user_id = ?"
            ).get(req.user.id);
        }

        res.json({
            user: {
                ...user,
                profile: {
                    ...profile,
                    preferences: JSON.parse(profile.preferences || "{}"),
                },
            },
        });
    } catch (err) {
        console.error("Get profile error:", err);
        res.status(500).json({ error: "Failed to fetch profile" });
    }
});

// ── PATCH /api/user/profile ────────────────────────────────────────

router.patch("/profile", validate(updateProfileSchema), (req, res) => {
    try {
        // Ensure profile exists
        const existing = db.prepare(
            "SELECT * FROM user_profiles WHERE user_id = ?"
        ).get(req.user.id);

        if (!existing) {
            db.prepare(
                "INSERT INTO user_profiles (user_id) VALUES (?)"
            ).run(req.user.id);
        }

        const { display_name, avatar_url, timezone, preferences } = req.body;
        console.log("[User] Update profile body:", req.body);

        if (display_name !== undefined) {
            db.prepare("UPDATE user_profiles SET display_name = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?")
                .run(display_name, req.user.id);
        }
        if (avatar_url !== undefined) {
            db.prepare("UPDATE user_profiles SET avatar_url = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?")
                .run(avatar_url, req.user.id);
        }
        if (timezone !== undefined) {
            db.prepare("UPDATE user_profiles SET timezone = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?")
                .run(timezone, req.user.id);
        }
        if (preferences !== undefined) {
            db.prepare("UPDATE user_profiles SET preferences = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?")
                .run(JSON.stringify(preferences), req.user.id);
        }

        const profile = db.prepare(
            "SELECT * FROM user_profiles WHERE user_id = ?"
        ).get(req.user.id);

        res.json({
            profile: { ...profile, preferences: JSON.parse(profile.preferences || "{}") },
        });
    } catch (err) {
        console.error("Update profile error:", err);
        res.status(500).json({ error: "Failed to update profile" });
    }
});

// ── PATCH /api/user/password ───────────────────────────────────────

router.patch("/password", validate(changePasswordSchema), (req, res) => {
    try {
        const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.user.id);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const validCurrent = bcrypt.compareSync(req.body.current_password, user.password_hash);
        if (!validCurrent) {
            return res.status(401).json({ error: "Current password is incorrect" });
        }

        const newHash = bcrypt.hashSync(req.body.new_password, 10);
        db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(newHash, req.user.id);

        res.json({ message: "Password updated successfully" });
    } catch (err) {
        console.error("Change password error:", err);
        res.status(500).json({ error: "Failed to change password" });
    }
});

// ── DELETE /api/user/account ───────────────────────────────────────

router.delete("/account", (req, res) => {
    try {
        // CASCADE on foreign keys will clean up all related data
        const result = db.prepare("DELETE FROM users WHERE id = ?").run(req.user.id);

        if (result.changes === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        res.json({ message: "Account deleted successfully" });
    } catch (err) {
        console.error("Delete account error:", err);
        res.status(500).json({ error: "Failed to delete account" });
    }
});

export default router;
