"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.globalErrorHandler = globalErrorHandler;
const AppError_1 = require("../utils/AppError");
const zod_1 = require("zod"); // Import ZodError to handle validation errors
function globalErrorHandler(err, req, res, next) {
    const errorResponse = {
        message: 'An unexpected error occurred!'
    };
    console.error('Error from Global Error Handler:', err);
    if (err instanceof AppError_1.AppError) {
        // In App Error it is safe to send err.message otherwise send generic error message
        let message = err.message;
        if (err.errorObject instanceof zod_1.ZodError) {
            const errorMessages = err.errorObject.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join('; ') || message;
            message = 'Invalid Data - ' + errorMessages;
        }
        errorResponse.message = message;
        res.status(err.statusCode).json(errorResponse);
        return;
    }
    // Handle regular Error objects
    if (err instanceof Error) {
        errorResponse.message = err.message;
        res.status(400).json(errorResponse);
        return;
    }
    res.status(500).json(errorResponse);
    return;
}
