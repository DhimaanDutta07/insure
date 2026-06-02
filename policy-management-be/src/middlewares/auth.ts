//src/middlewares/auth.ts
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { Role } from "@prisma/client";
import prisma from "../utils/prismaClient";

// Extend Express Request type to include our user property
declare global {
    namespace Express {
        interface Request {
            user?: {
                userId: string;
                phone: string;
                email: string | null;
                role: string;
                permissions: any;
            }
        }
    }
}

interface JWTPayload {
    userId: string;
    phone: string;
    email: string | null;
    role: string;
    permissions: any;
    iat: number;
    exp: number;
}

class AuthenticationError extends Error {
    constructor(
        public message: string,
        public statusCode: number = 401
    ) {
        super(message);
        this.name = 'AuthenticationError';
    }
}

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined in environment variables");
}

export const authMiddleware = (allowedRoles: string[]) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            // Extract token from header
            const authHeader = req.header("Authorization");
            if (!authHeader?.startsWith("Bearer ")) {
                throw new AuthenticationError("No token provided", 401);
            }

            const token = authHeader.replace("Bearer ", "");

            // Verify token
            const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;

            // Check token expiration
            if (Date.now() >= decoded.exp * 1000) {
                throw new AuthenticationError("Token has expired", 401);
            }

            // Verify user still exists and is active
            const user = await prisma.user.findUnique({
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
        } catch (error) {
            if (error instanceof AuthenticationError) {
                res.status(error.statusCode).json({ 
                    error: error.message 
                });
            } else if (error instanceof jwt.JsonWebTokenError) {
                res.status(401).json({ 
                    error: "Invalid token" 
                });
            } else {
                console.error("Authentication error:", error);
                res.status(500).json({ 
                    error: "Internal server error" 
                });
            }
        }
    };
};

// Helper function to check specific permissions
export const checkPermission = (permission: string) => {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            const userPermissions = req.user?.permissions;
            
            if (!userPermissions || !userPermissions.includes(permission)) {
                throw new AuthenticationError("Insufficient permissions", 403);
            }
            
            next();
        } catch (error) {
            if (error instanceof AuthenticationError) {
                res.status(error.statusCode).json({ 
                    error: error.message 
                });
            } else {
                res.status(500).json({ 
                    error: "Internal server error" 
                });
            }
        }
    };
};