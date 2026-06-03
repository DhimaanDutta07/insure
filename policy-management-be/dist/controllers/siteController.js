"use strict";
// // controllers/siteController.ts
// import { Request, Response } from 'express';
// import { 
//   addSite, 
//   adminUpdateSite, 
//   adminAssignSiteToUser,
//   adminAssignMultipleSitesToUser,
//   fetchAllSites,
//   fetchUserSites,
//   adminRemoveSiteFromUser
// } from '../services/siteService';
// import { 
//   createSiteSchema,
//   updateSiteSchema,
//   assignSiteToUserSchema,
//   assignMultipleSitesToUserSchema,
//   getUserSitesSchema,
//   removeSiteFromUserSchema
// } from '../schemas/siteSchema';
// import { asyncTryCatch } from '../utils/errorHandler';
// export const createSite = asyncTryCatch(async (req: Request, res: Response): Promise<void> => {
//   const validatedData = createSiteSchema.parse({
//     body: req.body
//   });
//   const { name } = validatedData.body;
//   const site = await addSite({ name });
//   res.status(201).json(site);
// });
// export const updateSite = asyncTryCatch(async (req: Request, res: Response): Promise<void> => {
//   const validatedData = updateSiteSchema.parse({
//     params: req.params,
//     body: req.body
//   });
//   const { id } = validatedData.params;
//   const { name } = validatedData.body;
//   const updatedSite = await adminUpdateSite(id, { name });
//   res.status(200).json(updatedSite);
// });
// export const assignSiteToUser = asyncTryCatch(async (req: Request, res: Response): Promise<void> => {
//   const validatedData = assignSiteToUserSchema.parse({
//     body: req.body
//   });
//   const { user_id, site_id } = validatedData.body;
//   const updatedUser = await adminAssignSiteToUser(user_id, site_id);
//   res.status(200).json(updatedUser);
// });
// export const assignMultipleSitesToUser = asyncTryCatch(async (req: Request, res: Response): Promise<void> => {
//   const validatedData = assignMultipleSitesToUserSchema.parse({
//     body: req.body
//   });
//   const { user_id, site_ids } = validatedData.body;
//   const updatedUser = await adminAssignMultipleSitesToUser(user_id, site_ids);
//   res.status(200).json(updatedUser);
// });
// export const getAllSites = asyncTryCatch(async (req: Request, res: Response): Promise<void> => {
//   const sites = await fetchAllSites();
//   res.status(200).json(sites);
// });
// export const getUserSites = asyncTryCatch(async (req: Request, res: Response): Promise<void> => {
//   const validatedData = getUserSitesSchema.parse({ params: req.params });
//   const sites = await fetchUserSites(validatedData.params.user_id);
//   res.status(200).json(sites);
// });
// export const removeSiteFromUser = asyncTryCatch(async (req: Request, res: Response): Promise<void> => {
//   const validatedData = removeSiteFromUserSchema.parse({ params: req.params });
//   await adminRemoveSiteFromUser(validatedData.params.user_id, validatedData.params.site_id);
//   res.status(204).end();
// });
