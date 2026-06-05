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
        errorResponse.details = err.errorObject || undefined;
        res.status(err.statusCode).json(errorResponse);
        return;
    }
    // Handle regular Error objects
    if (err instanceof Error) {
        errorResponse.message = err.message;
        errorResponse.details = {
            name: err.name,
            code: err.code,
        };
        // Include stack trace in development for debugging
        if (process.env.NODE_ENV === 'development') {
            errorResponse.stack = err.stack;
        }
        res.status(400).json(errorResponse);
        return;
    }
    // Handle Prisma errors with specific messages
    if (err.code) {
        switch (err.code) {
            case 'P2002':
                errorResponse.message = 'Duplicate entry: A record with this value already exists';
                errorResponse.details = { fields: err.meta?.target };
                break;
            case 'P2025':
                errorResponse.message = 'Record not found';
                break;
            case 'P2003':
                errorResponse.message = 'Foreign key constraint failed: Related record does not exist';
                errorResponse.details = { field: err.meta?.field_name };
                break;
            case 'P2014':
                errorResponse.message = 'The change would violate a required relation';
                break;
            default:
                errorResponse.message = err.message || 'Database error occurred';
        }
        res.status(400).json(errorResponse);
        return;
    }
    res.status(500).json(errorResponse);
    return;
}
