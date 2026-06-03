"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.asyncTryCatch = void 0;
// Modified asyncTryCatch to properly return an Express RequestHandler
const asyncTryCatch = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch((error) => {
            console.error('Error:', error);
            // Pass the error to the next middleware (GlobalErrorHandler)
            next(error);
        });
    };
};
exports.asyncTryCatch = asyncTryCatch;
