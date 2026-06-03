"use strict";
// // // repositories/itemGroupRepository.ts
// // import { PrismaClient, ItemGroup, ItemName } from '@prisma/client';
// // const prisma = new PrismaClient();
// // export const createItemGroup = async (data: { name: string; description?: string }): Promise<ItemGroup> => {
// //   return prisma.itemGroup.create({ data });
// // };
// // export const getAllItemGroups = async (): Promise<ItemGroup[]> => {
// //   return prisma.itemGroup.findMany({
// //     where: { is_deleted: false },
// //   });
// // };
// // export const getItemNamesByGroupId = async (itemGroupId: string): Promise<ItemName[]> => {
// //   return prisma.itemName.findMany({
// //     where: { item_group_id: itemGroupId, is_deleted: false },
// //   });
// // };
// // export const createItemName = async (data: { name: string; description?: string; item_group_id: string }): Promise<ItemName> => {
// //   return prisma.itemName.create({
// //     data: {
// //       name: data.name,
// //       description: data.description,
// //       ItemGroup: { connect: { id: data.item_group_id } },
// //     },
// //   });
// // };
// // repositories/itemGroupRepository.ts
// import { PrismaClient, ItemGroup, ItemName } from '@prisma/client';
// const prisma = new PrismaClient();
// export const createItemGroup = async (data: { name: string; description?: string }): Promise<ItemGroup> => {
//   return prisma.itemGroup.create({ data });
// };
// export interface ItemGroupWithItemNames extends ItemGroup {
//   itemNames: ItemName[];
// }
// export interface ItemNameWithItemGroup extends ItemName {
//   itemGroup: {
//     name: string;
//   };
// }
// export const getAllItemGroups = async (): Promise<ItemGroupWithItemNames[]> => {
//   return prisma.itemGroup.findMany({
//     where: { is_deleted: false },
//     include: {
//       itemNames: {
//         where: { is_deleted: false },
//         select: { id: true, name: true, description: true, created_at: true, updated_at: true },
//       },
//     },
//   }) as Promise<ItemGroupWithItemNames[]>;
// };
// export const getAllItemNames = async (): Promise<ItemNameWithItemGroup[]> => {
//   return prisma.itemName.findMany({
//     where: { is_deleted: false },
//     include: {
//       itemGroup: {
//         select: { id: true, name: true, description: true, created_at: true, updated_at: true },
//       },
//     },
//   }) as Promise<ItemNameWithItemGroup[]>;
// };
// export const getItemGroupById = async (id: string): Promise<ItemGroup | null> => {
//   return prisma.itemGroup.findUnique({
//     where: { id, is_deleted: false },
//   });
// };
// export const updateItemGroup = async (id: string, data: { name?: string; description?: string }): Promise<ItemGroup> => {
//   return prisma.itemGroup.update({
//     where: { id },
//     data,
//   });
// };
// export const deleteItemGroup = async (id: string): Promise<ItemGroup> => {
//   return prisma.itemGroup.update({
//     where: { id },
//     data: { is_deleted: true },
//   });
// };
// export const createItemName = async (data: { name: string; description?: string; item_group_id: string }): Promise<ItemName> => {
//   return prisma.itemName.create({ data });
// };
// export const getItemNamesByGroupId = async (itemGroupId: string): Promise<ItemNameWithItemGroup[]> => {
//   return prisma.itemName.findMany({
//     where: { item_group_id: itemGroupId, is_deleted: false },
//     include:{
//       itemGroup:{
//         select:{
//           name:true
//         }
//       }
//     }
//   });
// };
// export const getItemNameById = async (id: string): Promise<ItemName | null> => {
//   return prisma.itemName.findUnique({
//     where: { id, is_deleted: false },
//   });
// };
// export const updateItemName = async (id: string, data: { name?: string; description?: string; item_group_id: string }): Promise<ItemName> => {
//   return prisma.itemName.update({
//     where: { id },
//     data,
//   });
// };
// export const deleteItemName = async (id: string): Promise<ItemName> => {
//   return prisma.itemName.update({
//     where: { id },
//     data: { is_deleted: true },
//   });
// };
