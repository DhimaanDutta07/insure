"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRequest = void 0;
const zod_1 = require("zod");
const validateRequest = (schema) => {
    return async (req, res, next) => {
        try {
            // Create a request object that matches the schema structure
            const requestData = {
                body: req.body || {},
                query: req.query || {},
                params: req.params || {},
                headers: req.headers || {},
                files: req.files || {},
            };
            const validatedData = await schema.parseAsync(requestData);
            req.validatedData = validatedData;
            next();
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Validation failed',
                    errors: error.errors.map((err) => ({
                        field: err.path.join('.'),
                        message: err.message,
                    })),
                });
            }
            return res.status(500).json({
                status: 'error',
                message: 'Internal server error during validation',
            });
        }
    };
};
exports.validateRequest = validateRequest;
