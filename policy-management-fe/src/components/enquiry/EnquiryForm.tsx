import React, { useState, useEffect } from "react";
import { Enquiry } from "../../types/enquiry";
import { enquiryService } from "../../services/enquiry.service";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Button } from "../ui/button";
import axios from "axios";
// import { Button } from "./ui/button";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

interface EnquiryFormProps {
  enquiry?: Enquiry;
  onSubmit: () => void;
  onCancel?: () => void; // Added cancel callback
}
interface Site {
  id: string;
  name: string;
}

// const SITES = [
//   "Union Dahej",
//   "Union Plus Dahej",
//   "United Jhagadia",
//   "Shiv Kathwada",
//   "SGP India Kosamba",
//   "Universal Mahuvej"
// ];

const PROPERTY_TYPES = [
  { value: "BTS", label: "BTS" },
  { value: "READY_TO_MOVE", label: "Ready to Move" },
  { value: "UNDER_CONSTRUCTION", label: "Under Construction" }
];

const initialFormState: Partial<Enquiry> = {
  date: new Date().toISOString().split("T")[0],
  siteName: "",
  areaRequired: 0,
  whenRequired: "",
  company: "",
  enquiryPersonOrBroker: "",
  contactNumber: 0,
  rentQuoted: 0,
  propertyType: "READY_TO_MOVE",
  remarks: "",
};

export const EnquiryForm: React.FC<EnquiryFormProps> = ({ enquiry, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState<Partial<Enquiry>>(initialFormState);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sites, setSites] = useState<Site[]>([]); // New state for sites
  useEffect(() => {
    const fetchSites = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/v1/sites`, { headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` } }) // Fetch sites from the backend
        setSites(response.data); // Assuming response.data contains the array of sites
      } catch (error) {
        console.error("Error fetching sites:", error);
        // Handle error (e.g., show a toast notification)
      }
    };

    fetchSites(); // Call the fetch function
  }, []);
  useEffect(() => {
    const timer = setTimeout(() => {
      if (enquiry) {
        setFormData(enquiry);
      } else {
        setFormData(initialFormState);
      }
    }, 500); // 1-second delay
  
    return () => clearTimeout(timer); // Cleanup function to clear timeout if dependency changes
  }, [enquiry]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | string,
    name?: string
  ) => {
    if (typeof e === "string" && name) {
      // Handle Select component changes
      setFormData((prev) => ({
        ...prev,
        [name]: name === "areaRequired" || name === "rentQuoted" ? Number(e) : e,
      }));
    } else if (typeof e === "object" && e !== null && "target" in e) {
      // Handle input/textarea changes
      const { name: inputName, value } = e.target;
      setFormData((prev) => ({
        ...prev,
        [inputName]: inputName === "areaRequired" || inputName === "rentQuoted" ? Number(value) : value,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (enquiry?.id) {
        await enquiryService.updateEnquiry(enquiry.id, formData);
        toast.success("Enquiry updated successfully!");
      } else {
        await enquiryService.createEnquiry(formData as Omit<Enquiry, "id" | "createdAt" | "updatedAt">);
        toast.success("Enquiry created successfully!");
        setFormData(initialFormState);
      }
      onSubmit();
    } catch (error: unknown) {
      console.error("Error submitting enquiry:", error);
      if (error instanceof Error) {
        setError(error.message || "Error submitting enquiry. Please try again.");
        toast.error(error.message || "Error submitting enquiry. Please try again.");
      } else {
        setError("An unknown error occurred. Please try again.");
        toast.error("An unknown error occurred. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="sm:max-w-full mx-auto bg-white rounded-lg border border-gray-300 shadow-lg p-5 mt-5">
      <h2 className="text-xl font-semibold text-gray-800 mb-6 text-left">
        {enquiry ? "Edit Enquiry" : "New Enquiry"}
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date <span className="text-red-500">*</span></label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className="w-full p-2 border rounded-md focus:ring-2 border-gray-300"
              required
            />
          </div>

          {/* Site Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Site Name <span className="text-red-500">*</span></label>
            <Select
              value={formData.siteName}
              onValueChange={(value) => handleChange(value, "siteName")}
              required
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a site" />
              </SelectTrigger>
              <SelectContent>
                {sites.map((site) => (
                  <SelectItem key={site.id} value={site.name}>
                    {site.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Area Required */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Area Required (sq. ft.) <span className="text-red-500">*</span></label>
            <input
              type="number"
              name="areaRequired"
              value={formData.areaRequired || ""}
              onChange={handleChange}
              placeholder="1000"
              className="w-full p-2 border rounded-md focus:ring-2 border-gray-300"
              required
            />
          </div>

          {/* When Required */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">When Required <span className="text-red-500">*</span></label>
            <input
              type="date"
              name="whenRequired"
              value={formData.whenRequired}
              onChange={handleChange}
              className="w-full p-2 border rounded-md focus:ring-2 border-gray-300"
              required
            />
          </div>

          {/* Company */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Company <span className="text-red-500">*</span></label>
            <input
              type="text"
              name="company"
              value={formData.company}
              onChange={handleChange}
              className="w-full p-2 border rounded-md focus:ring-2 border-gray-300"
              required
            />
          </div>

          {/* Contact Person/Broker */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person/Broker<span className="text-red-500"> *</span></label>
            <input
              type="text"
              name="enquiryPersonOrBroker"
              value={formData.enquiryPersonOrBroker}
              onChange={handleChange}
              className="w-full p-2 border rounded-md focus:ring-2 border-gray-300"
              required
            />
          </div>

          {/* Contact Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number<span className="text-red-500"> *</span></label>
            <input
              type="number" 
              name="contactNumber"
              value={formData.contactNumber || ""}
              onChange={(e) => {
                const value = e.target.value;
                if(value.length <= 10) {
                  handleChange(e);
                }
              }}
              onBlur={(e) => {
                if(e.target.value.length !== 10) {
                  setError("Contact number must be 10 digits");
                } else {
                  setError(null);
                }
              }}
              placeholder="1234567890"
              className={`w-full p-2 border rounded-md focus:ring-2 border-gray-300 ${
                error && formData.contactNumber?.toString().length !== 10 ? 'border-red-500' : ''
              }`}
              required
              maxLength={10}
              minLength={10}
            />
            {error && formData.contactNumber?.toString().length !== 10 && (
              <p className="text-red-500 text-sm mt-1">Contact number must be 10 digits</p>
            )}
          </div>

          {/* Rent Quoted */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rent Quoted <span className="text-red-500">*</span></label>
            <input
              type="number"
              name="rentQuoted"
              value={formData.rentQuoted || ""}
              onChange={handleChange}
              placeholder="10000"
              className="w-full p-2 border rounded-md focus:ring-2 border-gray-300"
              required
            />
          </div>

          {/* Property Type */}
          <div className="md:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Property Type <span className="text-red-500">*</span></label>
            <Select
              value={formData.propertyType}
              onValueChange={(value) => handleChange(value, "propertyType")}
              required
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select property type" />
              </SelectTrigger>
              <SelectContent>
                {PROPERTY_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Remarks */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
          <textarea
            name="remarks"
            value={formData.remarks}
            onChange={handleChange}
            rows={3}
            className="w-full p-2 border rounded-md focus:ring-2 border-gray-300"
            placeholder="Additional notes or comments..."
          />
        </div>

        {/* Error Message */}
        {/* {error && <div className="text-red-500 text-sm">{error}</div>} */}

        {/* Buttons */}
        <div className="flex justify-end gap-2">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="hover:bg-gray-100 border-gray-300"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            className="bg-blue-600 text-white hover:bg-blue-700"
            disabled={isSubmitting}
          >
            {isSubmitting
              ? "Submitting..."
              : enquiry
              ? "Update Enquiry"
              : "Create Enquiry"}
          </Button>
        </div>
      </form>
    </div>
  );
};