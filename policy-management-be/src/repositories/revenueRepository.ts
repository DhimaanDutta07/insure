import { PrismaClient, Revenue } from "@prisma/client";

const prisma = new PrismaClient();

export async function findRevenuesByTimePeriod(siteId: string | null, period: string): Promise<Revenue[]> {
  const today = new Date();
  let startDate, endDate;

  switch (period) {
    case 'last3Days':
      startDate = new Date(today);
      startDate.setDate(today.getDate() - 3);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(today);
      endDate.setHours(23, 59, 59, 999);
      break;
    case 'thisWeek':
      startDate = new Date(today);
      startDate.setDate(today.getDate() - today.getDay());
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(today);
      endDate.setHours(23, 59, 59, 999);
      break;
    case 'thisMonth':
      startDate = new Date(today.getFullYear(), today.getMonth(), 1);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(today);
      endDate.setHours(23, 59, 59, 999);
      break;
    case 'lastMonth':
      startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(today.getFullYear(), today.getMonth(), 0);
      endDate.setHours(23, 59, 59, 999);
      break;
    default:
      throw new Error("Invalid time period");
  }

  return prisma.revenue.findMany({
    where: {
      isDeleted: false,
      createdAt: {
        gte: startDate,
        lte: endDate
      },
      ...(siteId ? { siteId } : {}),
    },
    include: {
      policy: true,
      agent: true,
      commission: true,
    },
  });
}

export async function createRevenue(data: Omit<Revenue, "id" | "createdAt" | "updatedAt" | "isDeleted">): Promise<Revenue> {
  return prisma.revenue.create({ data });
}

export async function updateRevenue(id: string, data: Partial<Omit<Revenue, "id" | "createdAt" | "updatedAt" | "isDeleted">>): Promise<Revenue> {
  return prisma.revenue.update({ where: { id }, data });
}

export async function softDeleteRevenue(id: string): Promise<Revenue> {
  return prisma.revenue.update({ where: { id }, data: { isDeleted: true } });
}

export async function getRevenueById(id: string): Promise<Revenue | null> {
  return prisma.revenue.findUnique({ where: { id } });
}

export async function getAllRevenues(): Promise<Revenue[]> {
  return prisma.revenue.findMany({ where: { isDeleted: false } });
}