"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.enquiryService = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
exports.enquiryService = {
    // Create a new enquiry
    async createEnquiry(data) {
        if (!data.userId) {
            throw new Error("userId is required to create an enquiry");
        }
        // Verify user exists
        const user = await prisma.user.findUnique({
            where: { id: data.userId }
        });
        if (!user) {
            throw new Error("User not found");
        }
        return prisma.enquiry.create({
            data: {
                ...data,
                is_deleted: false,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                    },
                },
            },
        });
    },
    // Get all enquiries
    async getAllEnquiries() {
        try {
            //   const today = new Date();
            //   let startDate, endDate;
            //   // Calculate date ranges based on the time period
            //   switch (typeof timePeriod === 'string' ? timePeriod : 'custom') {
            //     case 'today':
            //       startDate = new Date(today);
            //       startDate.setHours(0, 0, 0, 0);
            //       endDate = new Date(today);
            //       endDate.setHours(23, 59, 59, 999);
            //       break;
            //     case 'yesterday':
            //       startDate = new Date(today);
            //       startDate.setDate(today.getDate() - 1);
            //       startDate.setHours(0, 0, 0, 0);
            //       endDate = new Date(today);
            //       endDate.setDate(today.getDate() - 1);
            //       endDate.setHours(23, 59, 59, 999);
            //       break;
            //     case 'thisWeek':
            //       startDate = new Date(today);
            //       startDate.setDate(today.getDate() - today.getDay()); // Start of week (Sunday)
            //       startDate.setHours(0, 0, 0, 0);
            //       endDate = new Date(today);
            //       endDate.setHours(23, 59, 59, 999);
            //       break;
            //     case 'thisMonth':
            //       startDate = new Date(today.getFullYear(), today.getMonth(), 1);
            //       startDate.setHours(0, 0, 0, 0);
            //       endDate = new Date(today);
            //       endDate.setHours(23, 59, 59, 999);
            //       break;
            //     case 'lastMonth':
            //       startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1); // First day of last month
            //       startDate.setHours(0, 0, 0, 0);
            //       endDate = new Date(today.getFullYear(), today.getMonth(), 0); // Last day of last month
            //       endDate.setHours(23, 59, 59, 999);
            //       break;
            //     case 'custom':
            //       if (typeof timePeriod !== 'string' && timePeriod.start && timePeriod.end) {
            //         startDate = new Date(timePeriod.start);
            //         endDate = new Date(timePeriod.end);
            //         // Validate dates
            //         if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            //           throw new Error('Invalid custom date format');
            //         }
            //         startDate.setHours(0, 0, 0, 0);
            //         endDate.setHours(23, 59, 59, 999);
            //         break;
            //       }
            //       // Fall through to default if custom dates are invalid
            //     default:
            //       startDate = new Date(today);
            //       startDate.setHours(0, 0, 0, 0);
            //       endDate = new Date(today);
            //       endDate.setHours(23, 59, 59, 999);
            //   }
            //   console.log('Date range:', { startDate, endDate }); // Debug log
            //   const whereClause = {
            //     createdAt: {
            //       gte: startDate,
            //       lte: endDate
            //     },
            //     is_deleted: false,
            //     ...(siteId && { site_id: siteId }), // Add site filter if siteId is provided
            //   };
            const enquiries = await prisma.enquiry.findMany({
                // where: whereClause,
                orderBy: {
                    createdAt: 'desc',
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            phone: true,
                        },
                    },
                },
            });
            return enquiries;
        }
        catch (error) {
            console.error("Error fetching enquiries:", error);
            throw new Error("Failed to fetch enquiries");
        }
    },
    // Get a single enquiry by ID
    async getEnquiryById(id) {
        return prisma.enquiry.findUnique({
            where: {
                id,
                is_deleted: false,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                    },
                },
            },
        });
    },
    // Update an enquiry
    async updateEnquiry(id, data) {
        // Remove fields that shouldn't be included in update
        const { id: enquiryId, userId, createdAt, updatedAt, user, ...updateData } = data;
        return prisma.enquiry.update({
            where: { id },
            data: updateData,
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                    },
                },
            },
        });
    },
    // Delete an enquiry (soft delete)
    async deleteEnquiry(id) {
        return prisma.enquiry.update({
            where: { id },
            data: {
                is_deleted: true,
            },
        });
    },
    // Get enquiries by user ID
    async getEnquiriesByUserId(userId) {
        return prisma.enquiry.findMany({
            where: {
                userId,
                is_deleted: false,
            },
            orderBy: {
                createdAt: 'desc',
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                    },
                },
            },
        });
    },
};
