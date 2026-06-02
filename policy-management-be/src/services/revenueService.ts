// import { RevenueRepository } from "../repositories/revenueRepository";
// import { Revenue } from "@prisma/client";

// export class RevenueService {
//   private revenueRepository: RevenueRepository;

//   constructor() {
//     this.revenueRepository = new RevenueRepository();
//   }

//   async getRevenuesByTimePeriod(siteId: string | null, period: string): Promise<Revenue[]> {
//     return this.revenueRepository.findByTimePeriod(siteId, period);
//   }

//   async createRevenue(data: Omit<Revenue, "id" | "createdAt" | "updatedAt" | "isDeleted">): Promise<Revenue> {
//     return this.revenueRepository.create(data);
//   }

//   async updateRevenue(id: string, data: Partial<Omit<Revenue, "id" | "createdAt" | "updatedAt" | "isDeleted">>): Promise<Revenue> {
//     return this.revenueRepository.update(id, data);
//   }

//   async deleteRevenue(id: string): Promise<Revenue> {
//     return this.revenueRepository.softDelete(id);
//   }
// }