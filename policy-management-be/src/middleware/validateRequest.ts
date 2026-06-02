import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';

// Extend Express Request type to include validatedData
declare global {
  namespace Express {
    interface Request {
      validatedData?: any;
    }
  }
}

export const validateRequest = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction) => {
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
    } catch (error) {
      if (error instanceof ZodError) {
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
