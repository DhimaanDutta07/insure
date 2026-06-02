// // // services/itemGroupService.ts
// // import { ItemGroup, ItemName } from '@prisma/client';
// // import { getAllItemGroups, getItemNamesByGroupId, createItemName } from '../repositories/itemGroupRepository';

// // export const fetchAllItemGroups = async (): Promise<ItemGroup[]> => {
// //   return getAllItemGroups();
// // };

// // export const fetchItemNamesByGroupId = async (itemGroupId: string): Promise<ItemName[]> => {
// //   return getItemNamesByGroupId(itemGroupId);
// // };

// // export const addItemName = async (itemGroupId: string, itemNameData: { name: string; description?: string }): Promise<ItemName> => {
// //   const data = { ...itemNameData, item_group_id: itemGroupId };
// //   return createItemName(data);
// // };

// // services/itemGroupService.ts
// import { ItemGroup, ItemName, Site } from '@prisma/client';
// import {
//   createItemGroup,
//   getAllItemGroups,
//   getItemGroupById,
//   updateItemGroup,
//   deleteItemGroup,
//   createItemName,
//   getItemNamesByGroupId,
//   getItemNameById,
//   updateItemName,
//   deleteItemName,
//   getAllItemNames,
//   ItemNameWithItemGroup,
// } from '../repositories/itemGroupRepository';
// import { generateTokenNumber } from '../repositories/materialReceiptRepository copy';
// import { fetchUserSites } from './siteService';

// export type ItemGroupWithItemNames = ItemGroup & { itemNames: ItemName[] };

// // Updated interface to include sites
// export interface ItemGroupsWithToken {
//   token_number: string;
//   itemGroups: ItemGroupWithItemNames[];
//   sites: Site[];
// }

// export const addItemGroup = async (itemGroupData: { name: string; description?: string }): Promise<ItemGroup> => {
//   return createItemGroup(itemGroupData);
// };

// export const fetchAllItemGroups = async (userId: string): Promise<ItemGroupsWithToken> => {
//   const [itemGroups, token_number, sites] = await Promise.all([
//     getAllItemGroups(),
//     generateTokenNumber(),
//     fetchUserSites(userId)
//   ]);
  
//   return { token_number, itemGroups, sites };
// };

// export const fetchItemGroupById = async (id: string): Promise<ItemGroup | null> => {
//   return getItemGroupById(id);
// };

// export const modifyItemGroup = async (id: string, itemGroupData: { name?: string; description?: string }): Promise<ItemGroup> => {
//   return updateItemGroup(id, itemGroupData);
// };

// export const removeItemGroup = async (id: string): Promise<ItemGroup> => {
//   return deleteItemGroup(id);
// };

// export const addItemName = async (itemGroupId: string, itemNameData: { name: string; description?: string }): Promise<ItemName> => {
//   const data = { ...itemNameData, item_group_id: itemGroupId };
//   return createItemName(data);
// };

// export const fetchItemNamesByGroupId = async (itemGroupId: string): Promise<ItemNameWithItemGroup[]> => {
//   return getItemNamesByGroupId(itemGroupId);
// };

// export const fetchItemNameById = async (id: string): Promise<ItemName | null> => {
//   return getItemNameById(id);
// };

// export const modifyItemName = async (id: string, itemNameData: { name?: string; description?: string; item_group_id:string }): Promise<ItemName> => {
//   return updateItemName(id, itemNameData);
// };

// export const removeItemName = async (id: string): Promise<ItemName> => {
//   return deleteItemName(id);
// };

// export const fetchAllItemNames = async (): Promise<ItemNameWithItemGroup[]> => {
//   return getAllItemNames();
// };