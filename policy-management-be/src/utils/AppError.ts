//src/utils/AppError.ts
export class AppError extends Error {
    statusCode: number;
    message: string;
    errorObject?: any;

    constructor(statusCode: number, name: 'ClientError' | 'ServerError', message: string, errorObject?: any) {
        super(message);
        this.name = name;
        this.statusCode = statusCode;
        this.message = message;
        this.errorObject = errorObject;

        // Error.captureStackTrace(this, this.constructor);
    }
}
