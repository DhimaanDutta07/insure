// High-performance API response caching middleware
// Caches GET responses in-memory and auto-invalidates on mutations
import { Request, Response, NextFunction } from 'express';
import { apiCache } from '../utils/lruCache';
import { createHash } from 'crypto';

// Route patterns to cache tags mapping
function getCacheTags(path: string): string[] {
  const tags: string[] = ['api'];
  
  if (path.includes('/policies')) {
    tags.push('policies');
    if (/\/policies\/[^/]+$/.test(path)) tags.push('policy-detail');
    if (path.includes('/dashboard-stats')) tags.push('dashboard');
  }
  if (path.includes('/companies')) tags.push('companies');
  if (path.includes('/agents')) tags.push('agents');
  if (path.includes('/commissions')) tags.push('commissions');
  if (path.includes('/claims')) tags.push('claims');
  if (path.includes('/enquiries')) tags.push('enquiries');
  if (path.includes('/revenues')) tags.push('revenues');
  if (path.includes('/users')) tags.push('users');
  if (path.includes('/roles')) tags.push('roles');
  if (path.includes('/policy-groups')) tags.push('policy-groups');
  if (path.includes('/policy-names')) tags.push('policy-names');
  if (path.includes('/policy-types')) tags.push('policy-types');
  if (path.includes('/commission-rules')) tags.push('commission-rules');
  if (path.includes('/reimbursements')) tags.push('reimbursements');
  if (path.includes('/sites')) tags.push('sites');
  if (path.includes('/clients')) tags.push('clients');
  if (path.includes('/vendors')) tags.push('vendors');
  if (path.includes('/materials')) tags.push('materials');
  if (path.includes('/purchase-orders')) tags.push('purchase-orders');
  if (path.includes('/trucks')) tags.push('trucks');
  
  return tags;
}

// Generate cache key from request
function generateCacheKey(req: Request): string {
  const url = req.originalUrl || req.url;
  const query = JSON.stringify(req.query);
  const role = (req as any).jwtPayload?.role || 'unknown';
  const hash = createHash('md5').update(`${url}:${query}:${role}`).digest('hex');
  return `api:${hash}`;
}

// Middleware to cache GET responses
export function apiCacheMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Skip non-GET requests for caching (but still track for invalidation)
  if (req.method !== 'GET') {
    // Attach invalidator to response
    const originalJson = res.json.bind(res);
    res.json = function(body: any) {
      // Invalidate related caches on successful mutation
      const statusCode = res.statusCode;
      if (statusCode >= 200 && statusCode < 300) {
        invalidateRelatedCaches(req.path);
      }
      return originalJson(body);
    };
    
    const originalSend = res.send.bind(res);
    res.send = function(body: any) {
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
  const cached = apiCache.get(cacheKey);
  
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
  res.json = function(body: any) {
    // Only cache successful responses with data
    if (res.statusCode >= 200 && res.statusCode < 300 && body !== undefined) {
      const tags = getCacheTags(req.path);
      const ttl = getCacheTTL(req.path);
      apiCache.set(cacheKey, body, ttl, tags);
    }
    return originalJson(body);
  };
  
  next();
}

// Determine cache TTL based on route
function getCacheTTL(path: string): number {
  if (path.includes('/dashboard-stats')) return 30_000; // 30s
  if (path.includes('/policies')) return 15_000; // 15s
  if (path.includes('/companies') || path.includes('/policy-types') || path.includes('/policy-names') || path.includes('/policy-groups')) {
    return 300_000; // 5min for reference data
  }
  if (path.includes('/users') || path.includes('/roles')) return 60_000; // 1min
  return 30_000; // 30s default
}

// Invalidate caches based on route patterns
function invalidateRelatedCaches(path: string): void {
  if (path.includes('/policies')) {
    apiCache.deleteByTag('policies');
    apiCache.deleteByTag('dashboard');
    apiCache.deleteByTag('policy-detail');
  }
  if (path.includes('/companies')) {
    apiCache.deleteByTag('companies');
    apiCache.deleteByTag('policies'); // policies reference companies
  }
  if (path.includes('/agents')) apiCache.deleteByTag('agents');
  if (path.includes('/commissions')) {
    apiCache.deleteByTag('commissions');
    apiCache.deleteByTag('dashboard');
  }
  if (path.includes('/claims')) apiCache.deleteByTag('claims');
  if (path.includes('/enquiries')) apiCache.deleteByTag('enquiries');
  if (path.includes('/revenues')) {
    apiCache.deleteByTag('revenues');
    apiCache.deleteByTag('dashboard');
  }
  if (path.includes('/users')) apiCache.deleteByTag('users');
  if (path.includes('/roles')) apiCache.deleteByTag('roles');
  if (path.includes('/policy-groups')) {
    apiCache.deleteByTag('policy-groups');
    apiCache.deleteByTag('policies');
  }
  if (path.includes('/policy-names')) {
    apiCache.deleteByTag('policy-names');
    apiCache.deleteByTag('policies');
  }
  if (path.includes('/policy-types')) {
    apiCache.deleteByTag('policy-types');
    apiCache.deleteByTag('policies');
  }
  if (path.includes('/commission-rules')) {
    apiCache.deleteByTag('commission-rules');
    apiCache.deleteByTag('dashboard');
  }
  if (path.includes('/reimbursements')) apiCache.deleteByTag('reimbursements');
  if (path.includes('/sites')) apiCache.deleteByTag('sites');
  if (path.includes('/clients')) apiCache.deleteByTag('clients');
  if (path.includes('/vendors')) apiCache.deleteByTag('vendors');
  if (path.includes('/materials')) apiCache.deleteByTag('materials');
  if (path.includes('/purchase-orders')) apiCache.deleteByTag('purchase-orders');
  if (path.includes('/trucks')) apiCache.deleteByTag('trucks');
}
