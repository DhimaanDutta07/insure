// src/utils/errorHandler.ts - Fixed version
import { Request, Response, NextFunction } from 'express';

// Modified asyncTryCatch to properly return an Express RequestHandler
export const asyncTryCatch = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch((error) => {
      console.error('Error:', error);
      
      // Pass the error to the next middleware (GlobalErrorHandler)
      next(error);
    });
  };
};