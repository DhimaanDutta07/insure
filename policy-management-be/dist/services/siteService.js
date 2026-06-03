"use strict";
// // services/siteService.ts
// import { Site, User } from '@prisma/client';
// import { 
//   createSite, 
//   updateSite, 
//   assignSiteToUser, 
//   assignMultipleSitesToUser,
//   getAllSites,
//   getUserSites,
//   removeSiteFromUser
// } from '../repositories/siteRepository';
// export const addSite = async (siteData: { name: string; }): Promise<Site> => {
//   return createSite(siteData);
// };
// export const adminUpdateSite = async (id: string, siteData: { name?: string;}): Promise<Site> => {
//   return updateSite(id, siteData);
// };
// export const adminAssignSiteToUser = async (userId: string, siteId: string): Promise<User> => {
//   return assignSiteToUser(userId, siteId);
// };
// export const adminAssignMultipleSitesToUser = async (userId: string, siteIds: string[]): Promise<User> => {
//   return assignMultipleSitesToUser(userId, siteIds);
// };
// export const fetchAllSites = async (): Promise<Site[]> => {
//   return getAllSites();
// };
// export const adminRemoveSiteFromUser = async (userId: string, siteId: string): Promise<void> => {
//   return removeSiteFromUser(userId, siteId);
// };
