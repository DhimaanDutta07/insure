// import { reimbursementRepository } from '../repositories/reimbursementRepository';
// import { Reimbursement } from '@prisma/client';

// export const reimbursementService = {
//   getAllReimbursements: async () => reimbursementRepository.findAll(),
//   getReimbursementById: async (id: string) => {
//     const reimbursement = await reimbursementRepository.findById(id);
//     if (!reimbursement) throw new Error('Reimbursement not found');
//     return reimbursement;
//   },
//   createReimbursement: async (data: Omit<Reimbursement, 'id' | 'createdAt' | 'updatedAt'>) => {
//     return reimbursementRepository.create(data);
//   },
//   updateReimbursement: async (id: string, data: Partial<Omit<Reimbursement, 'id' | 'createdAt' | 'updatedAt'>>) => {
//     await reimbursementService.getReimbursementById(id); // Check existence
//     return reimbursementRepository.update(id, data);
//   },
//   deleteReimbursement: async (id: string) => {
//     await reimbursementService.getReimbursementById(id); // Check existence
//     const result = await reimbursementRepository.delete(id);

//     if (!result.success) {
//       throw new Error(result.error); // Throw the error message from the repository
//     }
//     return result.data; // Return the deleted reimbursement on success  
//     },
// };