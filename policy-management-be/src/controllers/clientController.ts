// // import { Request, Response } from 'express';
// // import { createClient, deleteClient, getAllClients, getClientById, updateClient } from '../services/clientService';
// // import { clientSchema, clientUpdateSchema } from '../schemas/clientSchema';

// // export const clientController = {
// //   getAll: async (req: Request, res: Response) => {
// //     const clients = await getAllClients();
// //     res.json(clients);
// //   },
// //   getById: async (req: Request, res: Response) => {
// //     const client = await getClientById(req.params.id as string);
// //     res.json(client);
// //   },
// //   create: async (req: Request, res: Response) => {
// //     const data = clientSchema.parse(req.body);
// //     const client = await createClient({
// //       ...data,
// //       phone: data.phone ?? null,
// //       description: data.description ?? null,
// //     });
// //     res.status(201).json(client);
// //   },
// //   update: async (req: Request, res: Response) => {
// //     const data = clientUpdateSchema.parse(req.body);
// //     const client = await updateClient(req.params.id as string, data);
// //     res.json(client);
// //   },
// //   delete: async (req: Request, res: Response) => {
// //     await deleteClient(req.params.id as string);
// //     res.status(204).send();
// //   },
// // };



// // src/controllers/clientController.ts
// import { Request, Response } from 'express';
// import * as clientService from '../services/clientService';
// import { z } from 'zod';
// import { clientSchema } from '../schemas/clientSchema';

// export const createClient = async (req: Request, res: Response) => {
//   try {
//     const data = clientSchema.parse(req.body);
//     const client = await clientService.createClient({
//       ...data,
//       description: data.description ?? null,
//       phone: data.phone ? String(data.phone) : null,
//       status: 'Active', // Replace 'ACTIVE' with the appropriate default or dynamic value
//     });
//     res.status(201).json(client);
//   } catch (error) {
//     if (error instanceof z.ZodError) {
//       res.status(400).json({ error: error.errors });
//     } else {
//       res.status(500).json({ error: 'Internal server error' });
//     }
//   }
// };

// export const getAllClients = async (req: Request, res: Response) => {
//   try {
//     const clients = await clientService.getAllClients();
//     res.status(200).json(clients);
//   } catch (error) {
//     res.status(500).json({ error: 'Internal server error' });
//   }
// };

// export const getClientById = async (req: Request, res: Response) => {
//   try {
//     const client = await clientService.getClientById(req.params.id as string);
//     res.status(200).json(client);
//   } catch (error) {
//     res.status(404).json({ error: error instanceof Error ? error.message : 'Not Found' });
//   }
// };

// export const updateClient = async (req: Request, res: Response) => {
//   try {
//     const data = clientSchema.parse(req.body);
//     const client = await clientService.updateClient(req.params.id as string, {
//       ...data,
//       phone: data.phone ? String(data.phone) : null,
//     });
//     res.status(200).json(client);
//   } catch (error) {
//     if (error instanceof z.ZodError) {
//       res.status(400).json({ error: error.errors });
//     } else {
//       res.status(500).json({ error: 'Internal server error' });
//     }
//   }
// };

// export const deleteClient = async (req: Request, res: Response) => {
//   try {
//     const client = await clientService.deleteClient(req.params.id as string);
//     res.status(200).json(client);
//   } catch (error) {
//     if (error instanceof Error) {
//       return res.status(400).json({ error: 'Cannot delete reimbursement because it is associated with one or more revenues.' });
//     }
//     res.status(500).json({ error: 'Internal server error.' });
//   }
// };