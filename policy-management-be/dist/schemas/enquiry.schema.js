"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.enquirySchema = void 0;
const zod_1 = require("zod");
exports.enquirySchema = zod_1.z.object({
    date: zod_1.z.string(),
    siteName: zod_1.z.string().min(1, "Site name is required"),
    areaRequired: zod_1.z.number().min(1, "Area required must be greater than 0"),
    whenRequired: zod_1.z.string().min(1, "When required is required"),
    company: zod_1.z.string().min(1, "Company name is required"),
    enquiryPersonOrBroker: zod_1.z.string().min(1, "Enquiry person or broker is required"),
    contactNumber: zod_1.z.string().min(10, "Contact number must be at least 10 digits"),
    rentQuoted: zod_1.z.number().min(0, "Rent quoted cannot be negative"),
    propertyType: zod_1.z.enum(["BTS", "READY_TO_MOVE", "UNDER_CONSTRUCTION"], {
        required_error: "Property type is required",
    }),
    remarks: zod_1.z.string().optional(),
});
