// import prisma from '../utils/prismaClient';
// import { Client } from '@prisma/client';

// // export const clientRepository = {
// //   findAll: async () => prisma.client.findMany(),
// //   findById: async (id: string) => prisma.client.findUnique({ where: { id } }),
// //   create: async (data: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) => 
// //     prisma.client.create({ data }),
// //   update: async (id: string, data: Partial<Omit<Client, 'id' | 'createdAt' | 'updatedAt'>>) => 
// //     prisma.client.update({ where: { id }, data }),
// //   delete: async (id: string) => prisma.client.delete({ where: { id } }),
// // };
// export const createClient = async (data: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>): Promise<Client> => {
//     return prisma.client.create({ data });
//   };
  
//   export const getAllClients = async (): Promise<Client[]> => {
//     return prisma.client.findMany();
//   };
  
//   export const getClientById = async (id: string): Promise<Client | null> => {
//     return prisma.client.findUnique({ where: { id } });
//   };
  
//   export const updateClient = async (id: string, data: Partial<Client>): Promise<Client> => {
//     return prisma.client.update({ where: { id }, data });
//   };
  
//   export const deleteClient = async (id: string): Promise<Client> => {
//     return prisma.client.delete({ where: { id } });
//   };