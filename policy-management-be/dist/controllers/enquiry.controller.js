"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.enquiryController = void 0;
const enquiry_service_1 = require("../services/enquiry.service");
const enquiry_schema_1 = require("../schemas/enquiry.schema");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env.JWT_SECRET;
// Add global middleware to extract userId from token
const extractUserId = (req) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }
    try {
        const token = authHeader.split(' ')[1];
        if (!JWT_SECRET) {
            throw new Error("JWT_SECRET is not defined");
        }
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        return decoded.user_id;
    }
    catch (error) {
        return null;
    }
};
exports.enquiryController = {
    // Create a new enquiry
    async createEnquiry(req, res) {
        const userId = extractUserId(req);
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        try {
            const enquiry = await enquiry_service_1.enquiryService.createEnquiry({
                ...req.body,
                userId,
            });
            res.status(201).json(enquiry);
        }
        catch (error) {
            console.error("Error creating enquiry:", error);
            res.status(500).json({ error: "Failed to create enquiry" });
        }
    },
    // Get all enquiries
    async getAllEnquiries(req, res) {
        try {
            // const timePeriod = req.params.timePeriod as string;
            // const { siteId } = req.query;
            let enquiries;
            // if (timePeriod === 'custom' && start && end) {
            // Handle custom date range
            // enquiries = await enquiryService.getAllEnquiries(
            //   { start: start as string, end: end as string },
            //   siteId as string
            // );
            // } else {
            // Handle other time periods
            enquiries = await enquiry_service_1.enquiryService.getAllEnquiries(
            // timePeriod as string,
            // siteId as string
            );
            // }      
            res.status(200).json(enquiries);
        }
        catch (error) {
            console.error("Error fetching enquiries:", error);
            res.status(500).json({ error: "Failed to fetch enquiries" });
        }
    },
    // Get a single enquiry by ID
    async getEnquiryById(req, res) {
        try {
            const id = req.params.id;
            const enquiry = await enquiry_service_1.enquiryService.getEnquiryById(id);
            if (!enquiry) {
                return res.status(404).json({ error: "Enquiry not found" });
            }
            res.json(enquiry);
        }
        catch (error) {
            console.error("Error fetching enquiry:", error);
            res.status(500).json({ error: "Failed to fetch enquiry" });
        }
    },
    // Update an enquiry
    async updateEnquiry(req, res) {
        try {
            const id = req.params.id;
            const userId = extractUserId(req);
            if (!userId) {
                return res.status(401).json({ error: "Unauthorized" });
            }
            // Check if the enquiry belongs to the user
            const existingEnquiry = await enquiry_service_1.enquiryService.getEnquiryById(id);
            if (!existingEnquiry) {
                return res.status(404).json({ error: "Enquiry not found" });
            }
            if (existingEnquiry.userId !== userId) {
                return res.status(403).json({ error: "Forbidden: You can only update your own enquiries" });
            }
            // Validate the request body against our schema
            const validatedData = enquiry_schema_1.enquirySchema.parse(req.body);
            const enquiry = await enquiry_service_1.enquiryService.updateEnquiry(id, validatedData);
            res.json(enquiry);
        }
        catch (error) {
            console.error("Error updating enquiry:", error);
            if (error instanceof Error) {
                return res.status(400).json({ error: error.message });
            }
            res.status(500).json({ error: "Failed to update enquiry" });
        }
    },
    // Delete an enquiry
    async deleteEnquiry(req, res) {
        try {
            const id = req.params.id;
            const userId = extractUserId(req);
            if (!userId) {
                return res.status(401).json({ error: "Unauthorized" });
            }
            // // Check if the enquiry belongs to the user
            // const existingEnquiry = await enquiryService.getEnquiryById(id);
            // if (!existingEnquiry) {
            //   return res.status(404).json({ error: "Enquiry not found" });
            // }
            // if (existingEnquiry.userId !== userId) {
            //   return res.status(403).json({ error: "Forbidden: You can only delete your own enquiries" });
            // }
            await enquiry_service_1.enquiryService.deleteEnquiry(id);
            res.status(204).send();
        }
        catch (error) {
            console.error("Error deleting enquiry:", error);
            res.status(500).json({ error: "Failed to delete enquiry" });
        }
    },
    // Get enquiries by current user
    async getMyEnquiries(req, res) {
        try {
            const userId = extractUserId(req);
            if (!userId) {
                return res.status(401).json({ error: "Unauthorized" });
            }
            const enquiries = await enquiry_service_1.enquiryService.getEnquiriesByUserId(userId);
            res.json(enquiries);
        }
        catch (error) {
            console.error("Error fetching user enquiries:", error);
            res.status(500).json({ error: "Failed to fetch your enquiries" });
        }
    },
};
