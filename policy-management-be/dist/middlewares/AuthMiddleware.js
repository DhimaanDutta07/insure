"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.decodeJwt = decodeJwt;
exports.requireAuth = requireAuth;
exports.restrictTo = restrictTo;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
function decodeJwt(req, res, next) {
    const token = req.headers.authorization;
    // if (!authHeader || !authHeader.startsWith('Bearer ')) {
    //     res.status(401).json({ message: 'No token provided' });
    //     return;
    // }
    // const token: string = authHeader.split(' ')[1];
    try {
        if (token) {
            const decoded = jsonwebtoken_1.default.verify(token.split(' ')[1], process.env.JWT_SECRET);
            req.jwtPayload = decoded;
        }
        next();
    }
    catch (err) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
    }
}
function requireAuth(req, res, next) {
    if (!req.jwtPayload) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
    }
    next();
}
function restrictTo(roles) {
    return (req, res, next) => {
        if (!req.jwtPayload) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }
        if (!roles.includes(req.jwtPayload.role)) {
            res.status(403).json({ message: 'Forbidden' });
            return;
        }
        next();
    };
}
