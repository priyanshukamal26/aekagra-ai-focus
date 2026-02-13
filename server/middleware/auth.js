import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET && process.env.NODE_ENV === "production") {
    throw new Error("FATAL: JWT_SECRET environment variable is required in production");
}

// Fallback only in development — warn loudly
const secret = JWT_SECRET || "aekagra-dev-secret-change-in-production";
if (!JWT_SECRET) {
    console.warn("[Aekagra API] ⚠ Using default JWT_SECRET — set JWT_SECRET env var before deploying");
}

export function authenticateToken(req, res, next) {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1]; // Bearer <token>

    if (!token) {
        return res.status(401).json({ error: "Access token required", code: "TOKEN_MISSING" });
    }

    try {
        const payload = jwt.verify(token, secret);
        req.user = payload;
        next();
    } catch (err) {
        return res.status(403).json({ error: "Invalid or expired token", code: "TOKEN_INVALID" });
    }
}

export { secret as JWT_SECRET };
