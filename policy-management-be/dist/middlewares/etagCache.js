"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.etagCache = etagCache;
const crypto_1 = __importDefault(require("crypto"));
function etagCache(req, res, next) {
    // Only cache GET requests
    if (req.method !== 'GET')
        return next();
    const originalJson = res.json.bind(res);
    res.json = function (body) {
        // Generate ETag from response body
        const hash = crypto_1.default.createHash('md5').update(JSON.stringify(body)).digest('hex');
        const etag = `"${hash}"`;
        res.setHeader('ETag', etag);
        res.setHeader('Cache-Control', 'private, max-age=15, must-revalidate');
        // Check If-None-Match
        const ifNoneMatch = req.headers['if-none-match'];
        if (ifNoneMatch === etag) {
            res.status(304).end();
            return res;
        }
        return originalJson(body);
    };
    next();
}
