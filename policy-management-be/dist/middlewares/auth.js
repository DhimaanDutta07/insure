"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkPermission = exports.authMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prismaClient_1 = __importDefault(require("../utils/prismaClient"));
class AuthenticationError extends Error {
    constructor(message, statusCode = 401) {
        super(message);
        this.message = message;
        this.statusCode = statusCode;
        this.name = 'AuthenticationError';
    }
}
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined in environment variables");
}
const authMiddleware = (allowedRoles) => {
    return async (req, res, next) => {
        try {
            // Extract token from header
            const authHeader = req.header("Authorization");
            if (!authHeader?.startsWith("Bearer ")) {
                throw new AuthenticationError("No token provided", 401);
            }
            const token = authHeader.replace("Bearer ", "");
            // Verify token
            const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
            // Check token expiration
            if (Date.now() >= decoded.exp * 1000) {
                throw new AuthenticationError("Token has expired", 401);
            }
            // Verify user still exists and is active
            const user = await prismaClient_1.default.user.findUnique({
                where: {
                    id: decoded.userId,
                },
                include: {
                    role: true
                }
            });
            if (!user) {
                throw new AuthenticationError("User no longer exists", 401);
            }
            if (user.status !== 'Active') {
                throw new AuthenticationError("User account is inactive", 403);
            }
            // Check role authorization
            if (!user.role || !allowedRoles.includes(user.role.role_name.trim())) {
                throw new AuthenticationError("Insufficient permissions", 403);
            }
            // Add user info to request
            req.user = {
                userId: user.id,
                phone: user.phone,
                email: user.email,
                role: user.role.role_name.trim(),
                permissions: user.permissions
            };
            next();
        }
        catch (error) {
            if (error instanceof AuthenticationError) {
                res.status(error.statusCode).json({
                    error: error.message
                });
            }
            else if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
                res.status(401).json({
                    error: "Invalid token"
                });
            }
            else {
                console.error("Authentication error:", error);
                res.status(500).json({
                    error: "Internal server error"
                });
            }
        }
    };
};
exports.authMiddleware = authMiddleware;
// Helper function to check specific permissions
const checkPermission = (permission) => {
    return (req, res, next) => {
        try {
            const userPermissions = req.user?.permissions;
            if (!userPermissions || !userPermissions.includes(permission)) {
                throw new AuthenticationError("Insufficient permissions", 403);
            }
            next();
        }
        catch (error) {
            if (error instanceof AuthenticationError) {
                res.status(error.statusCode).json({
                    error: error.message
                });
            }
            else {
                res.status(500).json({
                    error: "Internal server error"
                });
            }
        }
    };
};
exports.checkPermission = checkPermission;
