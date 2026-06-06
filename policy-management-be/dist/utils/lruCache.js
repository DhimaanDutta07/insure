"use strict";
// Ultra-fast in-memory LRU cache for hot data
// Avoids dependency on external cache libraries for simplicity
Object.defineProperty(exports, "__esModule", { value: true });
exports.commissionStatsCache = exports.referenceCache = exports.policyListCache = exports.dashboardCache = exports.apiCache = exports.LRUCache = void 0;
class LRUCache {
    constructor(maxSize = 500, defaultTTLMs = 30000) {
        this.cache = new Map();
        this.maxSize = maxSize;
        this.defaultTTL = defaultTTLMs;
    }
    get(key) {
        const entry = this.cache.get(key);
        if (!entry)
            return undefined;
        if (Date.now() > entry.expiresAt) {
            this.cache.delete(key);
            return undefined;
        }
        // Move to end (most recently used)
        this.cache.delete(key);
        this.cache.set(key, entry);
        return entry.value;
    }
    set(key, value, ttlMs, tags) {
        if (this.cache.size >= this.maxSize) {
            // Evict oldest (first inserted)
            const firstKey = this.cache.keys().next().value;
            if (firstKey)
                this.cache.delete(firstKey);
        }
        // Delete if exists to move to end
        this.cache.delete(key);
        this.cache.set(key, {
            value,
            expiresAt: Date.now() + (ttlMs ?? this.defaultTTL),
            tags,
        });
    }
    delete(key) {
        this.cache.delete(key);
    }
    deleteByTag(tag) {
        for (const [key, entry] of this.cache.entries()) {
            if (entry.tags?.includes(tag)) {
                this.cache.delete(key);
            }
        }
    }
    deleteByPrefix(prefix) {
        for (const key of this.cache.keys()) {
            if (key.startsWith(prefix)) {
                this.cache.delete(key);
            }
        }
    }
    clear() {
        this.cache.clear();
    }
    get size() {
        return this.cache.size;
    }
    keys() {
        return this.cache.keys();
    }
}
exports.LRUCache = LRUCache;
// Singleton caches with different TTLs for different data types
exports.apiCache = new LRUCache(1000, 60000); // 60s - general API responses
exports.dashboardCache = new LRUCache(10, 300000); // 5min - dashboard data
exports.policyListCache = new LRUCache(50, 60000); // 1min - policy lists
exports.referenceCache = new LRUCache(200, 300000); // 5min - companies, policy names, types
exports.commissionStatsCache = new LRUCache(10, 30000); // 30s - commission stats
