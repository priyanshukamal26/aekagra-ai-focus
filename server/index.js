import "dotenv/config";
import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";

// Route imports
import authRoutes from "./routes/auth.js";
import focusRoutes from "./routes/focus.js";
import plannerRoutes from "./routes/planner.js";
import tutorRoutes from "./routes/tutor.js";
import analyticsRoutes from "./routes/analytics.js";
import dashboardRoutes from "./routes/dashboard.js";
import userRoutes from "./routes/user.js";

// Middleware imports
import { errorHandler } from "./middleware/errorHandler.js";
import db from "./db.js";

const app = express();
const PORT = process.env.PORT || 3001;
const CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:8080";

// ── Global Middleware ──────────────────────────────────────────────

app.use(cors({ origin: CORS_ORIGIN }));
app.use(express.json({ limit: "1mb" }));

// Rate limiter for auth routes (prevent brute force)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // 20 requests per window per IP
    message: { error: "Too many requests, please try again later", code: "RATE_LIMITED" },
    standardHeaders: true,
    legacyHeaders: false,
});

// ── Routes ─────────────────────────────────────────────────────────

app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/focus", focusRoutes);
app.use("/api/planner", plannerRoutes);
app.use("/api/tutor", tutorRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/user", userRoutes);

// Health check (with DB connectivity check)
app.get("/api/health", (_req, res) => {
    try {
        db.prepare("SELECT 1").get();
        res.json({
            status: "ok",
            timestamp: new Date().toISOString(),
            database: "connected",
        });
    } catch (err) {
        res.status(503).json({
            status: "degraded",
            timestamp: new Date().toISOString(),
            database: "disconnected",
        });
    }
});

// ── Error Handling ─────────────────────────────────────────────────

app.use(errorHandler);

// ── Graceful Shutdown ──────────────────────────────────────────────

function shutdown(signal) {
    console.log(`\n[Aekagra API] ${signal} received — shutting down gracefully...`);
    try {
        db.close();
        console.log("[Aekagra API] Database connection closed.");
    } catch (err) {
        console.error("[Aekagra API] Error closing database:", err);
    }
    process.exit(0);
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

// ── Start Server ───────────────────────────────────────────────────

app.listen(PORT, () => {
    console.log(`[Aekagra API] Server running on http://localhost:${PORT}`);
    console.log(`[Aekagra API] CORS origin: ${CORS_ORIGIN}`);
    console.log(`[Aekagra API] Routes: auth, focus, planner, tutor, analytics, dashboard, user`);
});
