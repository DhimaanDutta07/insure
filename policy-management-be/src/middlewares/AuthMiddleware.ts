//src/middlewares/AuthMiddleware.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JwtPayload } from 'jsonwebtoken';
import { UserRoleEnum } from '../schemas/userSchema'
import { z } from 'zod';

declare global {
    namespace Express {
        interface Request {
            jwtPayload?: AppJwtPayload;
        }
    }
}
export interface AppJwtPayload extends JwtPayload {
    userId: string;
    role: string;
    // Any other custom properties
}

export function decodeJwt(req: Request, res: Response, next: NextFunction) {
    const token  = req.headers.authorization;

    // if (!authHeader || !authHeader.startsWith('Bearer ')) {
    //     res.status(401).json({ message: 'No token provided' });
    //     return;
    // }

    // const token: string = authHeader.split(' ')[1];
    
    try {
        if (token) {
            const decoded = jwt.verify(token.split(' ')[1], process.env.JWT_SECRET!) as AppJwtPayload;
            req.jwtPayload = decoded;
        }
        next();
    } catch (err) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
    }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
    if (!req.jwtPayload) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
    }
    next();
}

export function restrictTo(roles: z.infer<typeof UserRoleEnum>[]) {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.jwtPayload) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }

        if (!roles.includes(req.jwtPayload.role as z.infer<typeof UserRoleEnum>)) {
            res.status(403).json({ message: 'Forbidden' });
            return;
        }

        next();
    };
}
