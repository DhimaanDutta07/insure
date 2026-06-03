"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.asyncTryCatch = void 0;
const asyncTryCatch = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
exports.asyncTryCatch = asyncTryCatch;
