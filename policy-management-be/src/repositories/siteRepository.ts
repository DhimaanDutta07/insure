// // repositories/siteRepository.ts
// import { PrismaClient, Site, User } from '@prisma/client';
 
// const prisma = new PrismaClient();

// export const createSite = async (data: { name: string; }): Promise<Site> => {
//   return prisma.site.create({ data });
// };

// export const updateSite = async (id: string, data: { name?: string; }): Promise<Site> => {
//   return prisma.site.update({
//     where: { id },
//     data,
//   });
// };

// export const assignSiteToUser = async (userId: string, siteId: string): Promise<User> => {
//   return prisma.user.update({
//     where: { id: userId },
//     data: {
//       sites: {
//         create: {
//           site_id: siteId
//         }
//       }
//     },
//     include: {
//       sites: {
//         include: {
//           site: true
//         }
//       }
//     }
//   });
// };

// export const assignMultipleSitesToUser = async (userId: string, siteIds: string[]): Promise<User> => {
//   // First, delete existing site assignments
//   await prisma.userSite.deleteMany({
//     where: { user_id: userId }
//   });

//   // Then create new site assignments
//   return prisma.user.update({
//     where: { id: userId },
//     data: {
//       sites: {
//         create: siteIds.map(siteId => ({
//           site_id: siteId
//         }))
//       }
//     },
//     include: {
//       sites: {
//         include: {
//           site: true
//         }
//       }
//     }
//   });
// };

// export const getAllSites = async (): Promise<Site[]> => {
//   return prisma.site.findMany({
//     where: { is_deleted: false },
//   });
// };

// export const removeSiteFromUser = async (userId: string, siteId: string): Promise<void> => {
//   await prisma.userSite.delete({
//     where: {
//       user_id_site_id: {
//         user_id: userId,
//         site_id: siteId
//       }
//     }
//   });
// };