import { Request, Response } from "express";
import { enquiryService } from "../services/enquiry.service";
import { Enquiry } from "../schemas/enquiry.schema";
import { enquirySchema } from "../schemas/enquiry.schema";
import { Prisma } from "@prisma/client";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

// Add global middleware to extract userId from token
const extractUserId = (req: Request): string | null => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  try {
    const token = authHeader.split(' ')[1];
    if (!JWT_SECRET) {
      throw new Error("JWT_SECRET is not defined");
    }
    const decoded = jwt.verify(token, JWT_SECRET) as unknown as { user_id: string };
    return decoded.user_id;
  } catch (error) {
    return null;
  }
};

export const enquiryController = {
  // Create a new enquiry
  async createEnquiry(req: Request, res: Response) {
    const userId = extractUserId(req);
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    try {
      const enquiry = await enquiryService.createEnquiry({
        ...req.body,
        userId,
      });
      res.status(201).json(enquiry);
    } catch (error) {
      console.error("Error creating enquiry:", error);
      res.status(500).json({ error: "Failed to create enquiry" });
    }
  },

  // Get all enquiries
  async getAllEnquiries(req: Request, res: Response) {
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
        enquiries = await enquiryService.getAllEnquiries(
          // timePeriod as string,
          // siteId as string
        );
      // }      
      res.status(200).json(enquiries);
    } catch (error) {
      console.error("Error fetching enquiries:", error);
      res.status(500).json({ error: "Failed to fetch enquiries" });
    }
  },

  // Get a single enquiry by ID
  async getEnquiryById(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const enquiry = await enquiryService.getEnquiryById(id);
      if (!enquiry) {
        return res.status(404).json({ error: "Enquiry not found" });
      }
      res.json(enquiry);
    } catch (error) {
      console.error("Error fetching enquiry:", error);
      res.status(500).json({ error: "Failed to fetch enquiry" });
    }
  },

  // Update an enquiry
  async updateEnquiry(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const userId = extractUserId(req);
      
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      // Check if the enquiry belongs to the user
      const existingEnquiry = await enquiryService.getEnquiryById(id);
      if (!existingEnquiry) {
        return res.status(404).json({ error: "Enquiry not found" });
      }

      if (existingEnquiry.userId !== userId) {
        return res.status(403).json({ error: "Forbidden: You can only update your own enquiries" });
      }

      // Validate the request body against our schema
      const validatedData = enquirySchema.parse(req.body);
      
      const enquiry = await enquiryService.updateEnquiry(id, validatedData);
      res.json(enquiry);
    } catch (error) {
      console.error("Error updating enquiry:", error);
      if (error instanceof Error) {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: "Failed to update enquiry" });
    }
  },

  // Delete an enquiry
  async deleteEnquiry(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
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

      await enquiryService.deleteEnquiry(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting enquiry:", error);
      res.status(500).json({ error: "Failed to delete enquiry" });
    }
  },

  // Get enquiries by current user
  async getMyEnquiries(req: Request, res: Response) {
    try {
      const userId = extractUserId(req);
      
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const enquiries = await enquiryService.getEnquiriesByUserId(userId);
      res.json(enquiries);
    } catch (error) {
      console.error("Error fetching user enquiries:", error);
      res.status(500).json({ error: "Failed to fetch your enquiries" });
    }
  },
}; 
