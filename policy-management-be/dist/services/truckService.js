"use strict";
// import { 
//   createTruckRepo,
//   getAllTrucksRepo,
//   getTruckByIdRepo,
//   updateTruckRepo,
//   deleteTruckRepo,
//   countTrucksRepo,
//   searchTrucksRepo,
//   countSearchResultsRepo
// } from "../repositories/truckRepository";
// import { CreateTruck, UpdateTruck, TruckFilter } from "../schemas/truckSchema";
// import { AppError } from "../utils/AppError";
// // Create a new truck
// export async function createTruckService(truckData: CreateTruck) {
//   try {
//     const truck = await createTruckRepo(truckData);
//     return {
//       id: truck.id,
//       truck_number: truck.truck_number,
//       // vendor_id: truck.vendor_id,
//       // vendor_name: truck.vendor?.name || null,
//       created_at: truck.created_at,
//       updated_at: truck.updated_at
//     };
//   } catch (error) {
//     if ((error as any).code === 'P2003') {
//       throw new AppError(400, 'ClientError', 'Invalid vendor ID provided');
//     }
//     throw new AppError(500, 'ServerError', 'Failed to create truck', error);
//   }
// }
// // Get all trucks with pagination and optional filtering
// export async function getAllTrucksService(
//   page = 1,
//   limit = 10,
//   filters: TruckFilter = { page, limit }
// ) {
//   const skip = (page - 1) * limit;
//   try {
//     const trucks = await getAllTrucksRepo(skip, limit, filters);
//     const totalCount = await countTrucksRepo(filters);
//     const totalPages = Math.ceil(totalCount / limit);
//     // Map trucks to include formatted dates if needed
//     const formattedTrucks = trucks.map(truck => ({
//       ...truck,
//       created_at: truck.created_at,
//       updated_at: truck.updated_at
//     }));
//     return {
//       trucks: formattedTrucks,
//       totalCount,
//       totalPages
//     };
//   } catch (error) {
//     throw new AppError(500, 'ServerError', 'Failed to retrieve trucks', error);
//   }
// }
// // Get a single truck by ID
// export async function getTruckByIdService(id: string) {
//   try {
//     const truck = await getTruckByIdRepo(id);
//     if (!truck) {
//       throw new AppError(404, 'ClientError', 'Truck not found');
//     }
//     return {
//       ...truck,
//       created_at: truck.created_at,
//       updated_at: truck.updated_at
//     };
//   } catch (error) {
//     if ((error as AppError).statusCode === 404) {
//       throw error;
//     }
//     throw new AppError(500, 'ServerError', 'Failed to retrieve truck', error);
//   }
// }
// // Update a truck
// export async function updateTruckService(id: string, updateData: UpdateTruck) {
//   try {
//     const updatedTruck = await updateTruckRepo(id, updateData);
//     return {
//       ...updatedTruck,
//       created_at: updatedTruck.created_at,
//       updated_at: updatedTruck.updated_at
//     };
//   } catch (error) {
//     if ((error as AppError).statusCode === 404) {
//       throw error;
//     }
//     throw new AppError(500, 'ServerError', 'Failed to update truck', error);
//   }
// }
// // Delete a truck
// export async function deleteTruckService(id: string): Promise<boolean> {
//   try {
//     return await deleteTruckRepo(id);
//   } catch (error) {
//     if ((error as AppError).statusCode === 404) {
//       throw error;
//     }
//     throw new AppError(500, 'ServerError', 'Failed to delete truck', error);
//   }
// }
// interface SearchQuery {
//   searchTerm?: string;
// }
// // Search trucks by truck number or vendor name
// export async function searchTrucksService(
//   searchQuery: SearchQuery,
//   page = 1,
//   limit = 10
// ) {
//   const skip = (page - 1) * limit;
//   try {
//     const trucks = await searchTrucksRepo(searchQuery.searchTerm ||"", skip, limit);
//     // const totalCount = await countSearchResultsRepo(searchQuery);
//     const totalPages = Math.ceil(trucks.length / limit);
//     // Map trucks to include formatted dates if needed
//     const formattedTrucks = trucks.map(truck => ({
//       ...truck,
//       created_at: truck.created_at,
//       updated_at: truck.updated_at
//     }));
//     return {
//       trucks: formattedTrucks,
//       totatrulCount: trucks.length,
//       totalPages
//     };
//   } catch (error) {
//     throw new AppError(500, 'ServerError', 'Failed to search trucks', error);
//   }
// }
