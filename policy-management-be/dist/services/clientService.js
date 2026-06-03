"use strict";
// // import { clientRepository } from '../repositories/clientRepository';
// // import { Client } from '@prisma/client';
// // export const clientService = {
// //   getAllClients: async () => clientRepository.findAll(),
// //   getClientById: async (id: string) => {
// //     const client = await clientRepository.findById(id);
// //     if (!client) throw new Error('Client not found');
// //     return client;
// //   },
// //   createClient: async (data: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) => {
// //     const existing = await prisma.client.findFirst({ where: { name: data.name } });
// //     if (existing) throw new Error('Name already exists');
// //     return clientRepository.create(data);
// //   },
// //   updateClient: async (id: string, data: Partial<Omit<Client, 'id' | 'createdAt' | 'updatedAt'>>) => {
// //     await clientService.getClientById(id); // Check existence
// //     return clientRepository.update(id, data);
// //   },
// //   deleteClient: async (id: string) => {
// //     await clientService.getClientById(id); // Check existence
// //     return clientRepository.delete(id);
// //   },
// // };
// import * as clientRepository from '../repositories/clientRepository';
// import { Client } from '@prisma/client';
// export const createClient = async (data: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>): Promise<Client> => {
//   return clientRepository.createClient(data);
// };
// export const getAllClients = async (): Promise<Client[]> => {
//   return clientRepository.getAllClients();
// };
// export const getClientById = async (id: string): Promise<Client> => {
//   const client = await clientRepository.getClientById(id);
//   if (!client) throw new Error('Client not found');
//   return client;
// };
// export const updateClient = async (id: string, data: Partial<Client>): Promise<Client> => {
//   return clientRepository.updateClient(id, data);
// };
// export const deleteClient = async (id: string): Promise<Client> => {
//   return clientRepository.deleteClient(id);
// };
