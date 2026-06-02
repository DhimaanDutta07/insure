// import { useEffect, useState } from "react";
// import axios from "axios";
// import { useParams, useNavigate } from "react-router-dom";
// import { Button } from "../../components/ui/button";
// import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
// // import { Badge } from "../../components/ui/badge";
// import { Download, FileText, Calendar, Package, CreditCard, Building, ArrowLeft, CheckCircle, AlertTriangle } from "lucide-react";
// import PurchaseOrderTrucks1 from "./PurchaseOrderTrucks1";



// interface PurchaseOrder {
//   id: string;
//   vendor_id: string;
//   material_id: string;
//   quantity: string;
//   amount: string;
//   document_path: string;
//   document_name: string;
//   PO_number:string;
//   received_quantity: string | null;
//   unit: string;
//   status: string;
//   issued_at: string;
//   expiry_date: string;
//   vendor: { id: string; name: string };
//   material: { id: string; name: string };
// }

// const PurchaseOrderDetail = () => {
//   const { id } = useParams();
//   const navigate = useNavigate();
//   const [order, setOrder] = useState<PurchaseOrder | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");

//   useEffect(() => {
//     if (!id) return;

//     const fetchOrder = async () => {
//       try {
//         const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/v1/purchase-order/${id}`, {
//           headers: {
//             Authorization: `Bearer ${localStorage.getItem("authToken")}`,
//           },
//         });
//         setOrder(response.data.data);
//       } catch (err) {
//         console.error(err);
//         setError("Failed to fetch purchase order");
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchOrder();
//   }, [id]);

//   if (loading) return (
//     <div className="flex items-center justify-center h-96">
//       <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
//     </div>
//   );

//   if (error) return (
//     <Card className="max-w-3xl mx-auto mt-8">
//       <CardContent className="pt-6">
//         <div className="text-center text-red-500 py-8">
//           <p className="text-xl font-semibold">{error}</p>
//           <Button variant="outline" onClick={() => navigate(-1)} className="mt-4">
//             Go Back
//           </Button>
//         </div>
//       </CardContent>
//     </Card>
//   );

//   if (!order) return (
//     <Card className="max-w-3xl mx-auto mt-8">
//       <CardContent className="pt-6">
//         <div className="text-center text-gray-500 py-8">
//           <p className="text-xl font-semibold">No order found.</p>
//           <Button variant="outline" onClick={() => navigate(-1)} className="mt-4">
//             Go Back
//           </Button>
//         </div>
//       </CardContent>
//     </Card>
//   );

//   const isPDF = order.document_path?.endsWith(".pdf");

//   // Helper function to format currency
//   const formatCurrency = (amount: string) => {
//     return new Intl.NumberFormat('en-IN', {
//       style: 'currency',
//       currency: 'INR',
//       maximumFractionDigits: 0
//     }).format(Number(amount));
//   };

//   // Helper function to get status color
//   const getStatusColor = (status: string) => {
//     switch (status.toLowerCase()) {
//       case 'pending':
//         return ' text-amber-600 border-amber-200';
//       case 'completed':
//         return 'text-green-600 border-green-200';
//       case 'cancelled':
//         return ' text-red-600 border-red-200';
//       case 'active':
//         return ' text-white border-amber-100';
//       default:
//         return ' text-blue-600 border-blue-200';
//     }
//   };

//   const formatDate = (dateString: string) => {
//     return new Date(dateString).toLocaleDateString('en-US', { 
//       year: 'numeric', 
//       month: 'long', 
//       day: 'numeric' 
//     });
//   };

//   // Calculate the remaining quantity
//   const calculateRemainingQuantity = () => {
//     const totalQuantity = Number(order.quantity);
//     const receivedQuantity = order.received_quantity ? Number(order.received_quantity) : 0;
//     return totalQuantity - receivedQuantity;
//   };

//   const remainingQuantity = calculateRemainingQuantity();
//   const fulfillmentPercentage = order.received_quantity 
//     ? Math.round((Number(order.received_quantity) / Number(order.quantity)) * 100) 
//     : 0;

//   return (
//     <div className="p-6 space-y-6">
//       <div className="flex justify-between items-center">
//         <h1 className="text-2xl font-bold text-gray-800">PO Details</h1>
//         <Button 
//           variant="outline" 
//           onClick={() => navigate(-1)} 
//           className="flex items-center gap-2 bg-white border-gray-300"
//         >
//           <ArrowLeft className="h-4 w-4" /> Back
//         </Button>
//       </div>
      
//       <div className="flex flex-col md:flex-row gap-6">
//         {/* Left Card - Purchase Order Details */}
//         <div className="w-full md:w-1/2 flex flex-col gap-6 min-h-[50vh]">
//           <Card className="shadow-sm border border-gray-100 rounded-lg">
//             {/* <CardHeader className="pb-4">
//               <div className="flex justify-between items-center">
//                 <div>
//                   <CardTitle className="text-2xl font-bold text-gray-800">Purchase Order Details</CardTitle>
//                   <p className="text-gray-500 text-sm mt-1">Order #{id}</p>
//                 </div>
//               </div>
//             </CardHeader> */}

//             <CardContent className="pt-6">
//               <div className="mt-4 grid grid-cols-1 gap-6">
//                 <div className="grid grid-cols-2 gap-6">
//                   {/* PO_Number */}
//                   <div className="flex items-start gap-2">
//                     <FileText className="h-5 w-5 text-blue-600 mt-1" />
//                     <div>
//                       <span className="text-gray-500 text-sm">PO Number </span>
//                       <span className={`mt-1 font-medium px-3 py-0.5 rounded-full text-xs ${getStatusColor(order.status)}`}
//                       > {order.status}</span>
//                       <h3 className="text-base font-medium text-gray-800">{order.PO_number}</h3>
//                     </div>
//                   </div>
//                   {/* Vendor */}
//                   <div className="flex items-start gap-2">
//                     <Building className="h-5 w-5 text-blue-600 mt-1" />
//                     <div>
//                       <p className="text-gray-500 text-sm">Vendor</p>
//                       <h3 className="text-base font-medium text-gray-800">{order.vendor.name}</h3>
//                     </div>
//                   </div>
//                 </div>

//                 <div className="grid grid-cols-2 gap-6">
//                   {/* Issued Date */}
//                   <div className="flex items-start gap-2">
//                     <Calendar className="h-5 w-5 text-blue-600 mt-1" />
//                     <div>
//                       <p className="text-gray-500 text-sm">Issued Date</p>
//                       <h3 className="text-base font-medium text-gray-800">{formatDate(order.issued_at)}</h3>
//                     </div>
//                   </div>
//                   {/* Material */}
//                   <div className="flex items-start gap-2">
//                     <Package className="h-5 w-5 text-blue-600 mt-1" />
//                     <div>
//                       <p className="text-gray-500 text-sm">Material</p>
//                       <h3 className="text-base font-medium text-gray-800">{order.material.name}</h3>
//                       <p className="text-gray-700 text-sm">{Number(order.quantity).toLocaleString()} {order.unit}</p>
//                     </div>
//                   </div>
//                 </div>

//                 <div className="grid grid-cols-2 gap-6">
//                   {/* Expiry Date */}
//                   <div className="flex items-start gap-2">
//                     <Calendar className="h-5 w-5 text-blue-600 mt-1" />
//                     <div>
//                       <p className="text-gray-500 text-sm">Expiry Date</p>
//                       <h3 className="text-base font-medium text-gray-800">{formatDate(order.expiry_date)}</h3>
//                     </div>
//                   </div>
//                   {/* Amount */}
//                   <div className="flex items-start gap-2">
//                     <CreditCard className="h-5 w-5 text-blue-600 mt-1" />
//                     <div>
//                       <p className="text-gray-500 text-sm">Amount</p>
//                       <h3 className="text-base font-medium text-gray-800">{formatCurrency(order.amount)}</h3>
//                     </div>
//                   </div>

//                   {/* Status */}
//                   {/* <div className="flex items-start gap-2">
//                     <FileText className="h-5 w-5 text-blue-600 mt-1" />
//                     <div>
//                       <p className="text-gray-500 text-sm">Status</p>
//                       <Badge 
//                         className={`mt-1 font-medium px-3 py-0.5 rounded-full text-xs ${getStatusColor(order.status)}`}
//                       >
//                         {order.status}
//                       </Badge>
//                     </div>
//                   </div> */}
//                 </div>

//                 {/* Quantity Tracker Section */}
//                 <div className="border-t border-gray-300 pt-4 mt-2">
//                   <h3 className="text-lg font-semibold text-gray-800 mb-3">Quantity Tracker</h3>
                  
//                   <div className="grid grid-cols-1 gap-4">
//                     {/* Order Quantity */}
//                     <div className="flex items-center justify-between">
//                       <div className="flex items-center gap-2">
//                         <Package className="h-5 w-5 text-gray-600" />
//                         <span className="text-gray-800">Ordered Quantity:</span>
//                       </div>
//                       <span className="font-medium">
//                         {Number(order.quantity).toLocaleString()} {order.unit}
//                       </span>
//                     </div>
                    
//                     {/* Received Quantity */}
//                     <div className="flex items-center justify-between">
//                       <div className="flex items-center gap-2">
//                         <CheckCircle className="h-5 w-5 text-green-600" />
//                         <span className="text-gray-800">Received Quantity:</span>
//                       </div>
//                       <span className="font-medium">
//                         {order.received_quantity ? Number(order.received_quantity).toLocaleString() : "0"} {order.unit}
//                         <span className="text-sm text-gray-500 ml-2">
//                           ({fulfillmentPercentage}%)
//                         </span>
//                       </span>
//                     </div>
                    
//                     {/* Remaining Quantity */}
//                     <div className="flex items-center justify-between">
//                       <div className="flex items-center gap-2">
//                         <AlertTriangle className="h-5 w-5 text-amber-600" />
//                         <span className="text-gray-800">Remaining Quantity:</span>
//                       </div>
//                       <span className="font-medium">
//                         {remainingQuantity.toLocaleString()} {order.unit}
//                       </span>
//                     </div>
                    
//                     {/* Progress Bar */}
//                     <div className="mt-2">
//                       <div className="w-full bg-gray-200 rounded-full h-2.5">
//                         <div 
//                           className="bg-blue-600 h-2.5 rounded-full" 
//                           style={{ width: `${fulfillmentPercentage}%` }}
//                         ></div>
//                       </div>
//                       <div className="flex justify-between text-xs text-gray-500 mt-1">
//                         <span>0%</span>
//                         <span>50%</span>
//                         <span>100%</span>
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             </CardContent>
//           </Card>
//         </div>
        
//         {/* Right Column - Document View */}
//         <div className="w-full min-h-[50vh] md:w-1/2 flex flex-col gap-6">
//           <Card className="shadow-sm border border-gray-100 rounded-lg">
//             <CardHeader className="pb-4">
//               <div className="flex items-center gap-3">
//                 <FileText className="h-6 w-6 text-blue-600" />
//                 <CardTitle className="text-2xl font-bold text-gray-800">Document</CardTitle>
//               </div>
//             </CardHeader>
            
//             <CardContent>
//               <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
//                 <div className="p-4 h-85 flex items-center justify-center">
//                   {isPDF ? (
//                     <iframe
//                       src={order.document_path}
//                       className="w-full h-full rounded"
//                       title="PDF Preview"
//                     />
//                   ) : (
//                     <img
//                       src={order.document_path}
//                       alt={order.document_name}
//                       className="max-h-full object-contain"
//                     />
//                   )}
//                 </div>
//                 <div className="p-4 bg-white border-t flex justify-between items-center">
//                   <div>
//                     <p className="text-sm text-gray-500">Document Name</p>
//                     <p className="font-medium truncate max-w-xs">{order.document_name}</p>
//                   </div>
//                   <Button 
//                     className="bg-blue-600 hover:bg-blue-700 text-white"
//                   >
//                     <a 
//                       href={order.document_path} 
//                       target="_blank"
//                       download={order.document_name} 
//                       className="flex items-center gap-2"
//                       onClick={(e) => {
//                         if (!order.document_path.match(/\.(jpg|jpeg|png|gif)$/i)) {
//                           e.preventDefault();
//                           fetch(order.document_path)
//                             .then(response => response.blob())
//                             .then(blob => {
//                               const url = window.URL.createObjectURL(blob);
//                               const link = document.createElement('a');
//                               link.href = url;
//                               link.setAttribute('download', order.document_name);
//                               document.body.appendChild(link);
//                               link.click();
//                               document.body.removeChild(link);
//                               window.URL.revokeObjectURL(url);
//                             });
//                         }
//                       }}
//                     >
//                       <Download className="h-4 w-4" /> Download
//                     </a>
//                   </Button>
//                 </div>
//               </div>
//             </CardContent>
//           </Card>
//         </div>
//       </div>
      
//       {/* Add the Trucks Component */}
//       <PurchaseOrderTrucks1 />
//     </div>
//   );
// };

// export default PurchaseOrderDetail;