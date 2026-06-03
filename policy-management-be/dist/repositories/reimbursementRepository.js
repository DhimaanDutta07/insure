"use strict";
// import prisma from '../utils/prismaClient';
// import { Prisma, Reimbursement } from '@prisma/client';
// type DeleteResult =
//   | { success: true; data: Reimbursement }
//   | { success: false; error: string };
// export const reimbursementRepository = {
//   findAll: async () => prisma.reimbursement.findMany(),
//   findById: async (id: string) => prisma.reimbursement.findUnique({ where: { id }}
//   ),
//   create: async (data: Omit<Reimbursement, 'id' | 'createdAt' | 'updatedAt'>) => 
//     prisma.reimbursement.create({ data }),
//   update: async (id: string, data: Partial<Omit<Reimbursement, 'id' | 'createdAt' | 'updatedAt'>>) => 
//     prisma.reimbursement.update({ where: { id }, data }),
//   delete: async (id: string): Promise<DeleteResult> => {
//     try {
//       const deletedReimbursement = await prisma.reimbursement.delete({
//         where: { id },
//       });
//       return { success: true, data: deletedReimbursement };
//     } catch (error) {
//       if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
//         return {
//           success: false,
//           error: 'Cannot delete reimbursement because it is associated with one or more revenues.',
//         };
//       }
//       // Handle other potential errors (e.g., record not found)
//       if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
//         return {
//           success: false,
//           error: 'Reimbursement not found.',
//         };
//       }
//       // Log unexpected errors and throw them to be handled by higher layers if needed
//       console.error('Unexpected error deleting reimbursement:', error);
//       throw error; // Or return a generic error: { success: false, error: 'An unexpected error occurred.' }
//     }
//   },
// };
