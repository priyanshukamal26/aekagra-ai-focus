/**
 * Zod validation middleware factory.
 * Usage: router.post("/route", validate(myZodSchema), handler)
 *
 * Validates req.body against the given schema.
 * On failure → 400 with structured error details.
 * On success → replaces req.body with the parsed (typed) result and calls next().
 */
export function validate(schema) {
    return (req, res, next) => {
        const result = schema.safeParse(req.body);
        if (!result.success) {
            return res.status(400).json({
                error: "Validation failed",
                code: "VALIDATION_ERROR",
                details: result.error.flatten().fieldErrors,
            });
        }
        req.body = result.data;
        next();
    };
}
