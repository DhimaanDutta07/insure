"use strict";
// // // controllers/itemGroupController.ts
// import { Request, Response } from 'express';
// import {
//   addItemGroup,
//   fetchAllItemGroups,
//   fetchItemGroupById,
//   modifyItemGroup,
//   removeItemGroup,
//   addItemName,
//   fetchItemNamesByGroupId,
//   fetchItemNameById,
//   modifyItemName,
//   removeItemName,
//   ItemGroupWithItemNames,
//   fetchAllItemNames,
//   ItemGroupsWithToken,
// } from '../services/itemGroupService';
// import { ItemNameWithItemGroup } from '../repositories/itemGroupRepository';
// import jwt from 'jsonwebtoken';
// import { 
//   createItemGroupSchema,
//   updateItemGroupSchema,
//   createItemNameSchema,
//   updateItemNameSchema,
//   getItemGroupSchema,
//   getItemNamesSchema,
//   getItemNameSchema,
//   deleteItemGroupSchema,
//   deleteItemNameSchema
// } from '../schemas/itemGroupSchema';
// import { asyncTryCatch } from '../utils/errorHandler';
// const JWT_SECRET = process.env.JWT_SECRET || ''; // Store in .env
// // ItemGroup CRUD
// export const createItemGroup = asyncTryCatch(async (req: Request, res: Response): Promise<void> => {
//   const validatedData = createItemGroupSchema.parse({
//     body: req.body
//   });
//   const { name, description } = validatedData.body;
//   const itemGroup = await addItemGroup({ name, description: description || undefined });
//   res.status(201).json(itemGroup);
// });
// export const getAllItemGroups = asyncTryCatch(async (req: Request, res: Response): Promise<void> => {
//   const authHeader = req.headers.authorization;
//   if (!authHeader || !authHeader.startsWith('Bearer ')) {
//     console.log('Authorization header missing or invalid');
//     res.status(401).json({ error: 'Unauthorized: No valid token provided' });
//     return;
//   }
//   const token = authHeader.split(' ')[1]; // Extract token after "Bearer"
//   try {
//     // Decode the token to get the user ID
//     const decoded = jwt.verify(token, JWT_SECRET) as { user_id: string }; // Adjust type based on your token payload
//     const userId = decoded.user_id;
//     if (!userId) {
//       res.status(401).json({ error: 'Unauthorized: Invalid token' });
//       return;
//     }
//     const { token_number, itemGroups, sites } = await fetchAllItemGroups(userId);
//     res.status(200).json({ inward_number: token_number, itemGroups, sites });
//   } catch (error: any) {
//     if (error.name === 'JsonWebTokenError') {
//       res.status(401).json({ error: 'Unauthorized: Invalid token' });
//     } else {
//       throw error;
//     }
//   }
// });
// export const getItemGroup = asyncTryCatch(async (req: Request, res: Response): Promise<void> => {
//   const validatedData = getItemGroupSchema.parse({
//     params: req.params
//   });
//   const { id } = validatedData.params;
//   const itemGroup = await fetchItemGroupById(id);
//   if (!itemGroup) {
//     res.status(404).json({ error: 'ItemGroup not found' });
//     return;
//   }
//   res.status(200).json(itemGroup);
// });
// export const updateItemGroup = asyncTryCatch(async (req: Request, res: Response): Promise<void> => {
//   const validatedData = updateItemGroupSchema.parse({
//     params: req.params,
//     body: req.body
//   });
//   const { id } = validatedData.params;
//   const { name, description } = validatedData.body;
//   const updatedItemGroup = await modifyItemGroup(id, { name, description: description || undefined });
//   res.status(200).json(updatedItemGroup);
// });
// export const deleteItemGroup = asyncTryCatch(async (req: Request, res: Response): Promise<void> => {
//   const validatedData = deleteItemGroupSchema.parse({
//     params: req.params
//   });
//   const { id } = validatedData.params;
//   const deletedItemGroup = await removeItemGroup(id);
//   res.status(200).json(deletedItemGroup);
// });
// // ItemName CRUD
// export const createItemName = asyncTryCatch(async (req: Request, res: Response): Promise<void> => {
//   const validatedData = createItemNameSchema.parse({
//     params: req.params,
//     body: req.body
//   });
//   const { id } = validatedData.params; // itemGroupId
//   const { name, description } = validatedData.body;
//   const itemName = await addItemName(id, { name, description: description || undefined });
//   res.status(201).json(itemName);
// });
// export const getItemNames = asyncTryCatch(async (req: Request, res: Response): Promise<void> => {
//   const validatedData = getItemNamesSchema.parse({
//     params: req.params
//   });
//   const { id } = validatedData.params; // itemGroupId
//   const itemNames = await fetchItemNamesByGroupId(id);
//   res.status(200).json(itemNames);
// });
// export const getItemName = asyncTryCatch(async (req: Request, res: Response): Promise<void> => {
//   const validatedData = getItemNameSchema.parse({
//     params: req.params
//   });
//   const { id } = validatedData.params;
//   const itemName = await fetchItemNameById(id);
//   if (!itemName) {
//     res.status(404).json({ error: 'ItemName not found' });
//     return;
//   }
//   res.status(200).json(itemName);
// });
// export const updateItemName = asyncTryCatch(async (req: Request, res: Response): Promise<void> => {
//   const validatedData = updateItemNameSchema.parse({
//     params: req.params,
//     body: req.body
//   });
//   const { id } = validatedData.params;
//   const { name, description, item_group_id } = validatedData.body;
//   if (!item_group_id) {
//     res.status(400).json({ error: 'item_group_id is required' });
//     return;
//   }
//   const updatedItemName = await modifyItemName(id, { 
//     name, 
//     description: description || undefined,
//     item_group_id
//   });
//   res.status(200).json(updatedItemName);
// });
// export const deleteItemName = asyncTryCatch(async (req: Request, res: Response): Promise<void> => {
//   const validatedData = deleteItemNameSchema.parse({
//     params: req.params
//   });
//   const { id } = validatedData.params;
//   const deletedItemName = await removeItemName(id);
//   res.status(200).json(deletedItemName);
// });
// export const getAllItemNames = asyncTryCatch(async (req: Request, res: Response): Promise<void> => {
//   const itemNames: ItemNameWithItemGroup[] = await fetchAllItemNames();
//   if (!itemNames) {
//     res.status(404).json({ error: 'ItemNames not found' });
//     return;
//   }
//   res.status(200).json(itemNames);
// });
