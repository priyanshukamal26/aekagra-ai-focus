/**
 * Centralized error-handling middleware for Express.
 * Catches all errors thrown in route handlers and returns
 * a consistent JSON response shape: { error, code? }.
 */
export function errorHandler(err, _req, res, _next) {
    console.error("[Aekagra API] Error:", err.message || err);

    // Zod validation errors forwarded from validate middleware
    if (err.type === "validation") {
        return res.status(400).json({
            error: "Validation failed",
            code: "VALIDATION_ERROR",
            details: err.errors,
        });
    }

    const status = err.status || err.statusCode || 500;
    res.status(status).json({
        error: err.message || "Internal server error",
        code: err.code || "INTERNAL_ERROR",
    });
}
