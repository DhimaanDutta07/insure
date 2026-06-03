"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentAccessService = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
class DocumentAccessService {
    static async getPolicyDocuments(policyId, options = {}) {
        console.log(`🔍 DocumentAccessService.getPolicyDocuments called for policy: ${policyId}`);
        console.log(`🔍 Options:`, options);
        const cacheKey = `policy_docs_${policyId}_${JSON.stringify(options)}`;
        // Check cache first
        const cached = this.documentCache.get(cacheKey);
        if (cached && Date.now() < cached.expiresAt) {
            console.log(`📦 Returning cached documents for policy: ${policyId}`);
            return cached.data;
        }
        console.log(`🔄 Getting fresh documents for policy: ${policyId}`);
        // Get documents efficiently with single query
        const documents = await this.getDocumentsEfficiently(policyId, options);
        console.log(`✅ Retrieved ${documents.length} documents for policy: ${policyId}`);
        // Cache results
        if (options.cacheResults !== false) {
            this.documentCache.set(cacheKey, {
                data: documents,
                expiresAt: Date.now() + this.cacheExpiry
            });
            console.log(`💾 Cached documents for policy: ${policyId}`);
        }
        return documents;
    }
    static async getDocumentsEfficiently(policyId, options) {
        console.log(`🔍 getDocumentsEfficiently called for policy: ${policyId}`);
        // Single optimized query to get all documents
        const policyWithDocs = await prisma.policy.findUnique({
            where: { id: policyId },
            include: {
                documents: true,
                document_references: {
                    include: {
                        source_document: {
                            include: {
                                policy: true
                            }
                        }
                    }
                },
                parent_policy: {
                    include: {
                        documents: true,
                        document_references: {
                            include: {
                                source_document: true
                            }
                        }
                    }
                }
            }
        });
        console.log(`🔍 Policy found:`, !!policyWithDocs);
        if (!policyWithDocs) {
            console.log(`❌ Policy not found: ${policyId}`);
            return [];
        }
        console.log(`📄 Direct documents count:`, policyWithDocs.documents.length);
        console.log(`🔗 Document references count:`, policyWithDocs.document_references.length);
        // Combine direct and referenced documents
        const directDocs = policyWithDocs.documents.map(doc => ({
            ...doc,
            access_type: 'DIRECT',
            source_policy_id: policyId,
            transition_type: undefined
        }));
        const referencedDocs = policyWithDocs.document_references.map(ref => ({
            ...ref.source_document,
            access_type: 'REFERENCED',
            source_policy_id: ref.source_document.policy_id || '',
            reference_id: ref.id,
            transition_type: ref.transition_type
        }));
        console.log(`📄 Processed direct docs:`, directDocs.length);
        console.log(`🔗 Processed referenced docs:`, referencedDocs.length);
        // Return all documents (both direct and referenced)
        // Don't filter by transition type as we want to show all documents
        const allDocs = [...directDocs, ...referencedDocs];
        // Debug: Log document counts
        console.log(`Policy ${policyId} documents:`, {
            direct: directDocs.length,
            referenced: referencedDocs.length,
            total: allDocs.length
        });
        console.log(`📋 Final document list:`, allDocs.map(doc => ({
            id: doc.id,
            name: doc.original_name,
            access_type: doc.access_type,
            source_policy: doc.source_policy_id
        })));
        return allDocs;
        // Original filtering logic (commented out for now)
        /*
        // Filter by transition type if specified
        if (options.transitionType) {
          return [...directDocs, ...referencedDocs].filter(doc =>
            (doc.transition_type === options.transitionType) || doc.access_type === 'DIRECT'
          );
        }
        
        return [...directDocs, ...referencedDocs];
        */
    }
    static clearCache(policyId) {
        if (policyId) {
            // Clear cache for specific policy
            const keysToDelete = Array.from(this.documentCache.keys())
                .filter(key => key.includes(`policy_docs_${policyId}`));
            keysToDelete.forEach(key => this.documentCache.delete(key));
        }
        else {
            // Clear all cache
            this.documentCache.clear();
        }
    }
    static async getDocumentAccessStats(policyId) {
        const documents = await this.getPolicyDocuments(policyId);
        const stats = {
            total: documents.length,
            direct: documents.filter(d => d.access_type === 'DIRECT').length,
            referenced: documents.filter(d => d.access_type === 'REFERENCED').length,
            byCategory: {}
        };
        // Count by category
        documents.forEach(doc => {
            const category = doc.category || 'OTHER';
            stats.byCategory[category] = (stats.byCategory[category] || 0) + 1;
        });
        return stats;
    }
}
exports.DocumentAccessService = DocumentAccessService;
// Cache for frequently accessed documents
DocumentAccessService.documentCache = new Map();
DocumentAccessService.cacheExpiry = 5 * 60 * 1000; // 5 minutes
