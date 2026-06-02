// import React, { useState } from "react";
// import { Input } from "../ui/input";
// import { Button } from "../ui/button";
// import {
//   DialogHeader,
//   DialogTitle,
//   DialogFooter,
// } from "../ui/dialog";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "../ui/select";
// import axios from "axios";
// import { toast } from "sonner";
// import { useAuth } from "../../Context/AuthContext";
// import { PurchaseOrder } from "./TruckTableWithPagination2";

// interface Vendor {
//   id: string;
//   name: string;
// }

// interface RawMaterial {
//   id: string;
//   name: string;
// }

// interface CreatePurchaseOrderProps {
//   vendors: Vendor[];
//   materials: RawMaterial[];
//   onOrderCreated: (newPOData: PurchaseOrder) => Promise<void>;
//   onCancel?: () => void; 
// }

// const PurchaseOrderDialog: React.FC<CreatePurchaseOrderProps> = ({
//   vendors,
//   materials,
//   onOrderCreated,
//   onCancel
// }) => {
//   const { user } = useAuth();
//   const [document, setDocument] = useState<File | null>(null);
//   const [newOrder, setNewOrder] = useState<{
//     po_number:string;
//     vendor_id: string;
//     material_id: string;
//     quantity: number;
//     amount: number;
//     unit: "kg" | "tons";
//     status: "Pending";
//     expiry_date: string;
//   }>({
//     po_number:"",
//     vendor_id: "",
//     material_id: "",
//     quantity: 0,
//     amount: 0,
//     unit: "kg",
//     status: "Pending",
//     expiry_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
//       .toISOString()
//       .split("T")[0],
//   });

//   const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
//     e.preventDefault();

//     if (!newOrder.vendor_id) {
//       toast.error("Please select a vendor");
//       return;
//     }
    
//     if (!newOrder.material_id) {
//       toast.error("Please select a material");
//       return;
//     }
//     const formData = new FormData();

//     // Add all purchase order fields to the formData
//     Object.entries(newOrder).forEach(([key, value]) => {
//       formData.append(key, value.toString());
//     });

//     // Add document if available
//     if (document) {
//       formData.append("document", document);
//     }

//     if (user) {
//       formData.append("created_by_id", user.id);
//     }

//     try {
//       const response = await axios.post(
//         `${import.meta.env.VITE_BASE_URL}/api/v1/purchase-orders`,
//         formData,
//         {
//           headers: {
//             Authorization: `Bearer ${localStorage.getItem("authToken")}`,
//             "Content-Type": "multipart/form-data",
//           },
//         }
//       );

//       // Reset form state first
//       setNewOrder({
//         po_number:"",
//         vendor_id: "",
//         material_id: "",
//         quantity: 0,
//         amount: 0,
//         unit: "kg",
//         status: "Pending",
//         expiry_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
//           .toISOString()
//           .split("T")[0],
//       });
//       setDocument(null);

//       // Then notify parent of success
//       await onOrderCreated(response.data.data);
//     } catch (error) {
//       console.error("Error creating purchase order:", error);
//       toast.error("Failed to create purchase order. Please try again.");
//     }
//   };

//   // Style for required field indicator
//   const requiredField = <span className="text-red-500 ml-1">*</span>;

//   return (
//     <>
//       <DialogHeader className="text-left pb-1">
//         <DialogTitle className="text-left text-xl font-semibold text-gray-800">Create PO</DialogTitle>
//       </DialogHeader>
//       <form onSubmit={handleSubmit} className="space-y-4">
//         <div className="space-y-2">
//           <label htmlFor="po_number" className="text-sm font-medium">
//             PO Number{requiredField}
//           </label>
//           <Input
//             id="po_number"
//             type="text"
//             value={newOrder.po_number}
//             onChange={(e) =>
//               setNewOrder({ ...newOrder, po_number: e.target.value })
//             }
//             placeholder="Enter purchase order number"
//             required
//           />
//         </div>
//         <div className="grid grid-cols-2 items-center gap-4">
//           <div className="space-y-2">
//             <label htmlFor="vendor_id" className="text-sm font-medium">
//               Vendor{requiredField}
//             </label>
//             <Select
//               value={newOrder.vendor_id}
//               onValueChange={(value) =>
//                 setNewOrder({ ...newOrder, vendor_id: value })
//               }
//               required
//             >
//               <SelectTrigger className="w-full ">
//                 <SelectValue placeholder="Select vendor" />
//               </SelectTrigger>
//               <SelectContent>
//                 {vendors.map((vendor) => (
//                   <SelectItem key={vendor.id} value={vendor.id}>
//                     {vendor.name}
//                   </SelectItem>
//                 ))}
//               </SelectContent>
//             </Select>
//           </div>

//           <div className="space-y-2">
//             <label htmlFor="material_id" className="text-sm font-medium">
//               Raw Material{requiredField}
//             </label>
//             <Select
//               value={newOrder.material_id}
//               onValueChange={(value) =>
//                 setNewOrder({ ...newOrder, material_id: value })
//               }
//               required
//             >
//               <SelectTrigger className="w-full">
//                 <SelectValue placeholder="Select material" />
//               </SelectTrigger>
//               <SelectContent>
//                 {materials.map((material) => (
//                   <SelectItem key={material.id} value={material.id}>
//                     {material.name}
//                   </SelectItem>
//                 ))}
//               </SelectContent>
//             </Select>
//           </div>
//         </div>
//         <div className="grid grid-cols-2 items-center gap-4">
//           <div className="space-y-2">
//             <label htmlFor="quantity" className="text-sm font-medium">
//               Quantity{requiredField}
//             </label>
//             <Input
//               id="quantity"
//               type="number"
//               min="0"
//               step="any"
//               style={{
//                 WebkitAppearance: "none",
//                 MozAppearance: "textfield",
//               }}
//               value={newOrder.quantity || ""}
//               onChange={(e) =>
//                 setNewOrder({
//                   ...newOrder,
//                   quantity: parseFloat(e.target.value),
//                 })
//               }
//               required
//             />
//           </div>

//           <div className="space-y-2">
//             <label htmlFor="unit" className="text-sm font-medium">
//               Unit{requiredField}
//             </label>
//             <Select
//               value={newOrder.unit}
//               onValueChange={(value: "kg" | "tons") =>
//                 setNewOrder({ ...newOrder, unit: value })
//               }
//               required
//             >
//               <SelectTrigger className="w-full">
//                 <SelectValue placeholder="Select unit" />
//               </SelectTrigger>
//               <SelectContent>
//                 <SelectItem value="kg">KG</SelectItem>
//                 <SelectItem value="tons">TON</SelectItem>
//               </SelectContent>
//             </Select>
//           </div>
//         </div>
//         <div className="grid grid-cols-2 items-center gap-4">
//           <div className="space-y-2">
//             <label htmlFor="amount" className="text-sm font-medium">
//               Amount ₹{requiredField}
//             </label>
//             <Input
//               id="amount"
//               type="number"
//               min="0"
//               step="any"
//               style={{
//                 WebkitAppearance: "none",
//                 MozAppearance: "textfield",
//               }}
//               value={newOrder.amount || ""}
//               onChange={(e) =>
//                 setNewOrder({
//                   ...newOrder,
//                   amount: parseFloat(e.target.value),
//                 })
//               }
//               required
//             />
//           </div>

//           <div className="space-y-2">
//             <label htmlFor="expiry_date" className="text-sm font-medium">
//               Expiry Date{requiredField}
//             </label>
//             <Input
//               className="cursor-pointer"
//               id="expiry_date"
//               type="date"
//               value={newOrder.expiry_date}
//               onChange={(e) =>
//                 setNewOrder({ ...newOrder, expiry_date: e.target.value })
//               }
//               required
//               min={new Date().toISOString().split("T")[0]}
//             />
//           </div>
//         </div>
//         <div className="space-y-2">
//           <label htmlFor="document" className="text-sm font-medium">
//             Document{requiredField}
//           </label>
//           <Input
//             id="document"
//             type="file"
//             className="cursor-pointer"
//             onChange={(e) => {
//               if (e.target.files && e.target.files[0]) {
//                 setDocument(e.target.files[0]);
//               }
//             }}
//             required
//           />
//           {document && (
//             <p className="text-sm text-gray-500">Selected: {document.name}</p>
//           )}
//         </div>
//         <DialogFooter className="flex justify-end gap-2 pt-4">
//           <Button
//             type="button"
//             // variant="outline"
//             onClick={onCancel}
//             className=" border border-gray-300 cursor-pointer focus-visible:ring-gray-300 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-offset"
//           >
//             Cancel
//           </Button>
//           <Button
//             type="submit"
//             className="text-white hover:bg-gray-800 cursor-pointer"
//             style={{ background: "#0f50ba" }}
//           >
//             Create Order
//           </Button>
//         </DialogFooter>
//       </form>
//     </>
//   );
// };

// export default PurchaseOrderDialog;