// Ultra-fast in-memory LRU cache for hot data
// Avoids dependency on external cache libraries for simplicity

type CacheEntry<T> = { value: T; expiresAt: number; tags?: string[] };

export class LRUCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private maxSize: number;
  private defaultTTL: number;

  constructor(maxSize = 500, defaultTTLMs = 30_000) {
    this.maxSize = maxSize;
    this.defaultTTL = defaultTTLMs;
  }

  get(key: string): T | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return undefined;
    }
    // Move to end (most recently used)
    this.cache.delete(key);
    this.cache.set(key, entry);
    return entry.value;
  }

  set(key: string, value: T, ttlMs?: number, tags?: string[]): void {
    if (this.cache.size >= this.maxSize) {
      // Evict oldest (first inserted)
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }
    // Delete if exists to move to end
    this.cache.delete(key);
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + (ttlMs ?? this.defaultTTL),
      tags,
    });
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  deleteByTag(tag: string): void {
    for (const [key, entry] of this.cache.entries()) {
      if (entry.tags?.includes(tag)) {
        this.cache.delete(key);
      }
    }
  }

  deleteByPrefix(prefix: string): void {
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    }
  }

  clear(): void {
    this.cache.clear();
  }

  get size(): number {
    return this.cache.size;
  }

  keys(): IterableIterator<string> {
    return this.cache.keys();
  }
}

// Singleton caches with different TTLs for different data types
export const apiCache = new LRUCache<any>(1000, 60_000); // 60s - general API responses
export const dashboardCache = new LRUCache<any>(10, 30_000); // 30s - dashboard data
export const policyListCache = new LRUCache<any>(50, 15_000); // 15s - policy lists
export const referenceCache = new LRUCache<any>(200, 300_000); // 5min - companies, policy names, types
export const commissionStatsCache = new LRUCache<any>(10, 30_000); // 30s - commission stats
