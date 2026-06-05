"use strict";
// In-memory cache for reference data that rarely changes
// This significantly reduces database queries for companies, policy types, and policy groups
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.referenceCache = void 0;
class ReferenceCache {
    constructor() {
        this.cache = new Map();
        this.TTL = 10 * 60 * 1000; // 10 minutes cache TTL (increased for better performance)
    }
    isExpired(entry) {
        return Date.now() - entry.timestamp > this.TTL;
    }
    set(key, data) {
        this.cache.set(key, { data, timestamp: Date.now() });
    }
    get(key) {
        const entry = this.cache.get(key);
        if (!entry || this.isExpired(entry)) {
            this.cache.delete(key);
            return null;
        }
        return entry.data;
    }
    // Company cache methods
    async getCompanyByName(name) {
        const cacheKey = `company:${name}`;
        const cached = this.get(cacheKey);
        if (cached)
            return cached;
        const company = await prismaClient_1.default.company.findUnique({
            where: { name },
            select: { id: true, name: true }
        });
        if (company) {
            this.set(cacheKey, company);
        }
        return company;
    }
    async getCompanyById(id) {
        const cacheKey = `company:id:${id}`;
        const cached = this.get(cacheKey);
        if (cached)
            return cached;
        const company = await prismaClient_1.default.company.findUnique({
            where: { id },
            select: { id: true, name: true }
        });
        if (company) {
            this.set(cacheKey, company);
        }
        return company;
    }
    // Policy Type cache methods
    async getPolicyTypeByName(name) {
        const cacheKey = `policyType:${name}`;
        const cached = this.get(cacheKey);
        if (cached)
            return cached;
        const policyType = await prismaClient_1.default.policyType.findUnique({
            where: { name },
            select: { id: true, name: true }
        });
        if (policyType) {
            this.set(cacheKey, policyType);
        }
        return policyType;
    }
    // Policy Group cache methods
    async getPolicyGroupByName(name) {
        const cacheKey = `policyGroup:${name}`;
        const cached = this.get(cacheKey);
        if (cached)
            return cached;
        const policyGroup = await prismaClient_1.default.policyGroup.findUnique({
            where: { name },
            select: { id: true, name: true }
        });
        if (policyGroup) {
            this.set(cacheKey, policyGroup);
        }
        return policyGroup;
    }
    // Policy Name cache methods
    async getPolicyNameByName(name, companyId, policyGroupId) {
        const cacheKey = `policyName:${name}:${companyId || 'no-company'}:${policyGroupId || 'no-group'}`;
        const cached = this.get(cacheKey);
        if (cached)
            return cached;
        let policyName = null;
        if (companyId && policyGroupId) {
            policyName = await prismaClient_1.default.policyName.findFirst({
                where: {
                    name,
                    company_id: companyId,
                    policy_group_id: policyGroupId
                },
                select: { id: true, name: true }
            });
        }
        if (!policyName) {
            policyName = await prismaClient_1.default.policyName.findFirst({
                where: { name },
                select: { id: true, name: true }
            });
        }
        if (policyName) {
            this.set(cacheKey, policyName);
        }
        return policyName;
    }
    // Bulk cache methods for faster lookups
    async getAllCompanies() {
        const cacheKey = 'companies:all';
        const cached = this.get(cacheKey);
        if (cached)
            return cached;
        const companies = await prismaClient_1.default.company.findMany({
            select: { id: true, name: true }
        });
        this.set(cacheKey, companies);
        return companies;
    }
    async getAllPolicyTypes() {
        const cacheKey = 'policyTypes:all';
        const cached = this.get(cacheKey);
        if (cached)
            return cached;
        const policyTypes = await prismaClient_1.default.policyType.findMany({
            select: { id: true, name: true }
        });
        this.set(cacheKey, policyTypes);
        return policyTypes;
    }
    async getAllPolicyGroups() {
        const cacheKey = 'policyGroups:all';
        const cached = this.get(cacheKey);
        if (cached)
            return cached;
        const policyGroups = await prismaClient_1.default.policyGroup.findMany({
            select: { id: true, name: true }
        });
        this.set(cacheKey, policyGroups);
        return policyGroups;
    }
    // Clear cache (useful for testing or after manual data updates)
    clear() {
        this.cache.clear();
    }
    // Clear specific cache key pattern
    clearPattern(pattern) {
        for (const key of this.cache.keys()) {
            if (key.includes(pattern)) {
                this.cache.delete(key);
            }
        }
    }
    // Get cache stats for monitoring
    getStats() {
        return {
            size: this.cache.size,
            keys: Array.from(this.cache.keys())
        };
    }
}
const prismaClient_1 = __importDefault(require("./prismaClient"));
// Export singleton instance
exports.referenceCache = new ReferenceCache();
