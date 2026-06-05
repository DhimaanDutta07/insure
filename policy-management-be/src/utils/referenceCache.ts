// In-memory cache for reference data that rarely changes
// This significantly reduces database queries for companies, policy types, and policy groups

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

class ReferenceCache {
  private cache = new Map<string, CacheEntry<any>>();
  private readonly TTL = 5 * 60 * 1000; // 5 minutes cache TTL

  private isExpired(entry: CacheEntry<any>): boolean {
    return Date.now() - entry.timestamp > this.TTL;
  }

  private set<T>(key: string, data: T): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  private get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry || this.isExpired(entry)) {
      this.cache.delete(key);
      return null;
    }
    return entry.data as T;
  }

  // Company cache methods
  async getCompanyByName(name: string): Promise<{ id: string; name: string | null } | null> {
    const cacheKey = `company:${name}`;
    const cached = this.get<{ id: string; name: string | null }>(cacheKey);
    if (cached) return cached;

    const company = await prisma.company.findUnique({
      where: { name },
      select: { id: true, name: true }
    });

    if (company) {
      this.set(cacheKey, company);
    }
    return company;
  }

  async getCompanyById(id: string): Promise<{ id: string; name: string | null } | null> {
    const cacheKey = `company:id:${id}`;
    const cached = this.get<{ id: string; name: string | null }>(cacheKey);
    if (cached) return cached;

    const company = await prisma.company.findUnique({
      where: { id },
      select: { id: true, name: true }
    });

    if (company) {
      this.set(cacheKey, company);
    }
    return company;
  }

  // Policy Type cache methods
  async getPolicyTypeByName(name: string): Promise<{ id: string; name: string } | null> {
    const cacheKey = `policyType:${name}`;
    const cached = this.get<{ id: string; name: string }>(cacheKey);
    if (cached) return cached;

    const policyType = await prisma.policyType.findUnique({
      where: { name },
      select: { id: true, name: true }
    });

    if (policyType) {
      this.set(cacheKey, policyType);
    }
    return policyType;
  }

  // Policy Group cache methods
  async getPolicyGroupByName(name: string): Promise<{ id: string; name: string | null } | null> {
    const cacheKey = `policyGroup:${name}`;
    const cached = this.get<{ id: string; name: string | null }>(cacheKey);
    if (cached) return cached;

    const policyGroup = await prisma.policyGroup.findUnique({
      where: { name },
      select: { id: true, name: true }
    });

    if (policyGroup) {
      this.set(cacheKey, policyGroup);
    }
    return policyGroup;
  }

  // Policy Name cache methods
  async getPolicyNameByName(name: string, companyId?: string, policyGroupId?: string): Promise<{ id: string; name: string | null } | null> {
    const cacheKey = `policyName:${name}:${companyId || 'no-company'}:${policyGroupId || 'no-group'}`;
    const cached = this.get<{ id: string; name: string | null }>(cacheKey);
    if (cached) return cached;

    let policyName = null;
    if (companyId && policyGroupId) {
      policyName = await prisma.policyName.findFirst({
        where: {
          name,
          company_id: companyId,
          policy_group_id: policyGroupId
        },
        select: { id: true, name: true }
      });
    }

    if (!policyName) {
      policyName = await prisma.policyName.findFirst({
        where: { name },
        select: { id: true, name: true }
      });
    }

    if (policyName) {
      this.set(cacheKey, policyName);
    }
    return policyName;
  }

  // Clear cache (useful for testing or after manual data updates)
  clear(): void {
    this.cache.clear();
  }

  // Clear specific cache key pattern
  clearPattern(pattern: string): void {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  // Get cache stats for monitoring
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

import prisma from './prismaClient';

// Export singleton instance
export const referenceCache = new ReferenceCache();
