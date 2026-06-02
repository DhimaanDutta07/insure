export interface Enquiry {
  id: string;
  date: string;
  siteName: string;
  areaRequired: number;
  whenRequired: string;
  company: string;
  enquiryPersonOrBroker: string;
  contactNumber: number;
  rentQuoted: number;
  propertyType: "BTS" | "READY_TO_MOVE" | "UNDER_CONSTRUCTION";
  remarks?: string;
  createdAt: string;
  updatedAt: string;
  user:{
    id: string;
    name: string;
    email: string;
    role: string; 
  }
  is_deleted?: boolean; // Added property
} 