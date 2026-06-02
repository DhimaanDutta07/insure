import { z } from "zod";

export const enquirySchema = z.object({
  date: z.string(),
  siteName: z.string().min(1, "Site name is required"),
  areaRequired: z.number().min(1, "Area required must be greater than 0"),
  whenRequired: z.string().min(1, "When required is required"),
  company: z.string().min(1, "Company name is required"),
  enquiryPersonOrBroker: z.string().min(1, "Enquiry person or broker is required"),
  contactNumber: z.string().min(10, "Contact number must be at least 10 digits"),
  rentQuoted: z.number().min(0, "Rent quoted cannot be negative"),
  propertyType: z.enum(["BTS", "READY_TO_MOVE", "UNDER_CONSTRUCTION"], {
    required_error: "Property type is required",
  }),
  remarks: z.string().optional(),
});

export type Enquiry = z.infer<typeof enquirySchema>; 