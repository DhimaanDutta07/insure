"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppError = void 0;
//src/utils/AppError.ts
class AppError extends Error {
    constructor(statusCode, name, message, errorObject) {
        super(message);
        this.name = name;
        this.statusCode = statusCode;
        this.message = message;
        this.errorObject = errorObject;
        // Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
