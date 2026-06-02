import { z } from 'zod';

// Base schemas
const baseSiteSchema = z.object({
  id: z.string(),
  name: z.string(),
  created_at: z.date(),
  updated_at: z.date(),
});

// Request schemas
export const createSiteSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Site name is required"),
  }),
});

export const updateSiteSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
  body: z.object({
    name: z.string().min(1, "Site name is required"),
  }),
});

export const assignSiteToUserSchema = z.object({
  body: z.object({
    user_id: z.string(),
    site_id: z.string(),
  }),
});

export const assignMultipleSitesToUserSchema = z.object({
  body: z.object({
    user_id: z.string(),
    site_ids: z.array(z.string()),
  }),
});

export const getUserSitesSchema = z.object({
  params: z.object({
    user_id: z.string(),
  }),
});

export const removeSiteFromUserSchema = z.object({
  params: z.object({
    user_id: z.string(),
    site_id: z.string(),
  }),
});

// Response schemas
export const siteResponseSchema = baseSiteSchema;

export const siteListResponseSchema = z.array(siteResponseSchema);

// Types
export type CreateSiteRequest = z.infer<typeof createSiteSchema>;
export type UpdateSiteRequest = z.infer<typeof updateSiteSchema>;
export type AssignSiteToUserRequest = z.infer<typeof assignSiteToUserSchema>;
export type AssignMultipleSitesToUserRequest = z.infer<typeof assignMultipleSitesToUserSchema>;
export type GetUserSitesRequest = z.infer<typeof getUserSitesSchema>;
export type RemoveSiteFromUserRequest = z.infer<typeof removeSiteFromUserSchema>;
export type SiteResponse = z.infer<typeof siteResponseSchema>;
export type SiteListResponse = z.infer<typeof siteListResponseSchema>; 