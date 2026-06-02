//src/middlewares/GlobalErrorHandler.ts
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';
import { ZodError } from 'zod'; // Import ZodError to handle validation errors

export function globalErrorHandler(err: any, req: Request, res: Response, next: NextFunction) {
    const errorResponse: { message: string } = {
        message: 'An unexpected error occurred!'
    };

    console.error('Error from Global Error Handler:', err);

    if (err instanceof AppError) {
        // In App Error it is safe to send err.message otherwise send generic error message
        let message = err.message;

        if (err.errorObject instanceof ZodError) {
            const errorMessages =
                err.errorObject.errors.map((e: any) => `${e.path.join('.')}: ${e.message}`).join('; ') || message;
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
