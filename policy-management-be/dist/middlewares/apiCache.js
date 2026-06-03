"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiCacheMiddleware = apiCacheMiddleware;
const lruCache_1 = require("../utils/lruCache");
const crypto_1 = require("crypto");
// Route patterns to cache tags mapping
function getCacheTags(path) {
    const tags = ['api'];
    if (path.includes('/policies')) {
        tags.push('policies');
        if (/\/policies\/[^/]+$/.test(path))
            tags.push('policy-detail');
        if (path.includes('/dashboard-stats'))
            tags.push('dashboard');
    }
    if (path.includes('/companies'))
        tags.push('companies');
    if (path.includes('/agents'))
        tags.push('agents');
    if (path.includes('/commissions'))
        tags.push('commissions');
    if (path.includes('/claims'))
        tags.push('claims');
    if (path.includes('/enquiries'))
        tags.push('enquiries');
    if (path.includes('/revenues'))
        tags.push('revenues');
    if (path.includes('/users'))
        tags.push('users');
    if (path.includes('/roles'))
        tags.push('roles');
    if (path.includes('/policy-groups'))
        tags.push('policy-groups');
    if (path.includes('/policy-names'))
        tags.push('policy-names');
    if (path.includes('/policy-types'))
        tags.push('policy-types');
    if (path.includes('/commission-rules'))
        tags.push('commission-rules');
    if (path.includes('/reimbursements'))
        tags.push('reimbursements');
    if (path.includes('/sites'))
        tags.push('sites');
    if (path.includes('/clients'))
        tags.push('clients');
    if (path.includes('/vendors'))
        tags.push('vendors');
    if (path.includes('/materials'))
        tags.push('materials');
    if (path.includes('/purchase-orders'))
        tags.push('purchase-orders');
    if (path.includes('/trucks'))
        tags.push('trucks');
    return tags;
}
// Generate cache key from request
function generateCacheKey(req) {
    const url = req.originalUrl || req.url;
    const query = JSON.stringify(req.query);
    const role = req.jwtPayload?.role || 'unknown';
    const hash = (0, crypto_1.createHash)('md5').update(`${url}:${query}:${role}`).digest('hex');
    return `api:${hash}`;
}
// Middleware to cache GET responses
function apiCacheMiddleware(req, res, next) {
    // Skip non-GET requests for caching (but still track for invalidation)
    if (req.method !== 'GET') {
        // Attach invalidator to response
        const originalJson = res.json.bind(res);
        res.json = function (body) {
            // Invalidate related caches on successful mutation
            const statusCode = res.statusCode;
            if (statusCode >= 200 && statusCode < 300) {
                invalidateRelatedCaches(req.path);
            }
            return originalJson(body);
        };
        const originalSend = res.send.bind(res);
        res.send = function (body) {
            const statusCode = res.statusCode;
            if (statusCode >= 200 && statusCode < 300) {
                invalidateRelatedCaches(req.path);
            }
            return originalSend(body);
        };
        return next();
    }
    // Skip caching for certain paths
    const skipPaths = ['/health', '/api/v1/auth', '/api/v1/uploads', '/files'];
    if (skipPaths.some(p => req.path.startsWith(p))) {
        return next();
    }
    const cacheKey = generateCacheKey(req);
    const cached = lruCache_1.apiCache.get(cacheKey);
    if (cached) {
        // Set cache hit header for debugging
        res.setHeader('X-Cache', 'HIT');
        res.setHeader('Cache-Control', 'private, max-age=60');
        res.json(cached);
        return;
    }
    // Cache miss - intercept response
    res.setHeader('X-Cache', 'MISS');
    const originalJson = res.json.bind(res);
    res.json = function (body) {
        // Only cache successful responses with data
        if (res.statusCode >= 200 && res.statusCode < 300 && body !== undefined) {
            const tags = getCacheTags(req.path);
            const ttl = getCacheTTL(req.path);
            lruCache_1.apiCache.set(cacheKey, body, ttl, tags);
        }
        return originalJson(body);
    };
    next();
}
// Determine cache TTL based on route
function getCacheTTL(path) {
    if (path.includes('/dashboard-stats'))
        return 30000; // 30s
    if (path.includes('/policies'))
        return 15000; // 15s
    if (path.includes('/companies') || path.includes('/policy-types') || path.includes('/policy-names') || path.includes('/policy-groups')) {
        return 300000; // 5min for reference data
    }
    if (path.includes('/users') || path.includes('/roles'))
        return 60000; // 1min
    return 30000; // 30s default
}
// Invalidate caches based on route patterns
function invalidateRelatedCaches(path) {
    if (path.includes('/policies')) {
        lruCache_1.apiCache.deleteByTag('policies');
        lruCache_1.apiCache.deleteByTag('dashboard');
        lruCache_1.apiCache.deleteByTag('policy-detail');
    }
    if (path.includes('/companies')) {
        lruCache_1.apiCache.deleteByTag('companies');
        lruCache_1.apiCache.deleteByTag('policies'); // policies reference companies
    }
    if (path.includes('/agents'))
        lruCache_1.apiCache.deleteByTag('agents');
    if (path.includes('/commissions')) {
        lruCache_1.apiCache.deleteByTag('commissions');
        lruCache_1.apiCache.deleteByTag('dashboard');
    }
    if (path.includes('/claims'))
        lruCache_1.apiCache.deleteByTag('claims');
    if (path.includes('/enquiries'))
        lruCache_1.apiCache.deleteByTag('enquiries');
    if (path.includes('/revenues')) {
        lruCache_1.apiCache.deleteByTag('revenues');
        lruCache_1.apiCache.deleteByTag('dashboard');
    }
    if (path.includes('/users'))
        lruCache_1.apiCache.deleteByTag('users');
    if (path.includes('/roles'))
        lruCache_1.apiCache.deleteByTag('roles');
    if (path.includes('/policy-groups')) {
        lruCache_1.apiCache.deleteByTag('policy-groups');
        lruCache_1.apiCache.deleteByTag('policies');
    }
    if (path.includes('/policy-names')) {
        lruCache_1.apiCache.deleteByTag('policy-names');
        lruCache_1.apiCache.deleteByTag('policies');
    }
    if (path.includes('/policy-types')) {
        lruCache_1.apiCache.deleteByTag('policy-types');
        lruCache_1.apiCache.deleteByTag('policies');
    }
    if (path.includes('/commission-rules')) {
        lruCache_1.apiCache.deleteByTag('commission-rules');
        lruCache_1.apiCache.deleteByTag('dashboard');
    }
    if (path.includes('/reimbursements'))
        lruCache_1.apiCache.deleteByTag('reimbursements');
    if (path.includes('/sites'))
        lruCache_1.apiCache.deleteByTag('sites');
    if (path.includes('/clients'))
        lruCache_1.apiCache.deleteByTag('clients');
    if (path.includes('/vendors'))
        lruCache_1.apiCache.deleteByTag('vendors');
    if (path.includes('/materials'))
        lruCache_1.apiCache.deleteByTag('materials');
    if (path.includes('/purchase-orders'))
        lruCache_1.apiCache.deleteByTag('purchase-orders');
    if (path.includes('/trucks'))
        lruCache_1.apiCache.deleteByTag('trucks');
}
