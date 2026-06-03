// ETag-based HTTP caching middleware
// Returns 304 Not Modified for repeated requests with same content
import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

export function etagCache(req: Request, res: Response, next: NextFunction): void {
  // Only cache GET requests
  if (req.method !== 'GET') return next();

  const originalJson = res.json.bind(res);
  res.json = function (body: any) {
    // Generate ETag from response body
    const hash = crypto.createHash('md5').update(JSON.stringify(body)).digest('hex');
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