"use strict";
// import { Request, Response } from 'express';
// import { reimbursementService } from '../services/reimbursementService';
// import { reimbursementSchema, reimbursementUpdateSchema } from '../schemas/reimbursementSchema';
// export const reimbursementController = {
//   getAll: async (req: Request, res: Response) => {
//     const reimbursements = await reimbursementService.getAllReimbursements();
//     res.json(reimbursements);
//   },
//   getById: async (req: Request, res: Response) => {
//     const reimbursement = await reimbursementService.getReimbursementById(req.params.id as string);
//     res.json(reimbursement);
//   },
//   create: async (req: Request, res: Response) => {
//     const data = reimbursementSchema.parse(req.body);
//     const reimbursement = await reimbursementService.createReimbursement({
//       ...data,
//       description: data.description ?? null,
//     });
//     res.status(201).json(reimbursement);
//   },
//   update: async (req: Request, res: Response) => {
//     const data = reimbursementUpdateSchema.parse(req.body);
//     const reimbursement = await reimbursementService.updateReimbursement(req.params.id as string, data);
//     res.json(reimbursement);
//   },
//   delete: async (req: Request, res: Response) => {
//     try {
//       await reimbursementService.deleteReimbursement(req.params.id as string);
//       res.status(204).send();
//     } catch (error) {
//       if (error instanceof Error) {
//         if (error.message === 'Reimbursement not found') {
//           return res.status(404).json({ error: error.message });
//         }
//         if (error.message.includes('Cannot delete reimbursement')) {
//           return res.status(400).json({ error: error.message });
//         }
//       }
//       res.status(500).json({ error: 'Internal server error' });
//     }
//   },
// };
