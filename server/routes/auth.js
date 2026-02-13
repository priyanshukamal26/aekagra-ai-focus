import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import db from "../db.js";
import { authenticateToken, JWT_SECRET } from "../middleware/auth.js";

const router = Router();

// POST /api/auth/register
router.post("/register", (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: "Email and password are required" });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: "Password must be at least 6 characters" });
        }

        // Check if user already exists
        const existingUser = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
        if (existingUser) {
            return res.status(409).json({ error: "An account with this email already exists" });
        }

        // Hash password and insert user
        const passwordHash = bcrypt.hashSync(password, 10);
        const result = db.prepare("INSERT INTO users (email, password_hash) VALUES (?, ?)").run(email, passwordHash);

        const token = jwt.sign(
            { id: result.lastInsertRowid, email },
            JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.status(201).json({
            token,
            user: { id: result.lastInsertRowid, email },
        });
    } catch (err) {
        console.error("Register error:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});

// POST /api/auth/login
router.post("/login", (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: "Email and password are required" });
        }

        const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
        if (!user) {
            return res.status(401).json({ error: "Invalid email or password" });
        }

        const validPassword = bcrypt.compareSync(password, user.password_hash);
        if (!validPassword) {
            return res.status(401).json({ error: "Invalid email or password" });
        }

        const token = jwt.sign(
            { id: user.id, email: user.email },
            JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.json({
            token,
            user: { id: user.id, email: user.email },
        });
    } catch (err) {
        console.error("Login error:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});

// GET /api/auth/me — get current user from token
router.get("/me", authenticateToken, (req, res) => {
    try {
        const user = db.prepare("SELECT id, email, created_at FROM users WHERE id = ?").get(req.user.id);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        res.json({ user });
    } catch (err) {
        console.error("Me error:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});

export default router;
