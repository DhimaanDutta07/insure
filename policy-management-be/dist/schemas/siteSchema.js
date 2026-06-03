"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.siteListResponseSchema = exports.siteResponseSchema = exports.removeSiteFromUserSchema = exports.getUserSitesSchema = exports.assignMultipleSitesToUserSchema = exports.assignSiteToUserSchema = exports.updateSiteSchema = exports.createSiteSchema = void 0;
const zod_1 = require("zod");
// Base schemas
const baseSiteSchema = zod_1.z.object({
    id: zod_1.z.string(),
    name: zod_1.z.string(),
    created_at: zod_1.z.date(),
    updated_at: zod_1.z.date(),
});
// Request schemas
exports.createSiteSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(1, "Site name is required"),
    }),
});
exports.updateSiteSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string(),
    }),
    body: zod_1.z.object({
        name: zod_1.z.string().min(1, "Site name is required"),
    }),
});
exports.assignSiteToUserSchema = zod_1.z.object({
    body: zod_1.z.object({
        user_id: zod_1.z.string(),
        site_id: zod_1.z.string(),
    }),
});
exports.assignMultipleSitesToUserSchema = zod_1.z.object({
    body: zod_1.z.object({
        user_id: zod_1.z.string(),
        site_ids: zod_1.z.array(zod_1.z.string()),
    }),
});
exports.getUserSitesSchema = zod_1.z.object({
    params: zod_1.z.object({
        user_id: zod_1.z.string(),
    }),
});
exports.removeSiteFromUserSchema = zod_1.z.object({
    params: zod_1.z.object({
        user_id: zod_1.z.string(),
        site_id: zod_1.z.string(),
    }),
});
// Response schemas
exports.siteResponseSchema = baseSiteSchema;
exports.siteListResponseSchema = zod_1.z.array(exports.siteResponseSchema);
