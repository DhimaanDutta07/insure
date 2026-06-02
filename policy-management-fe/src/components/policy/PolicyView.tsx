// import React from "react";
// import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
// import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
// import { Badge } from "../ui/badge";
// import {
//   User,
//   Users,
//   FileText,
//   CreditCard,
//   Shield,
//   Calendar,
//   IndianRupee,
//   Building,
// } from "lucide-react";

// const formatDate = (dateString: string) =>
//   new Date(dateString).toLocaleDateString("en-US", {
//     year: "numeric",
//     month: "short",
//     day: "numeric",
//   });

// const formatCurrency = (amount: number) => {
//   if (typeof amount !== "number" || isNaN(amount)) return "-";
//   return new Intl.NumberFormat("en-IN", {
//     style: "currency",
//     currency: "INR",
//     minimumFractionDigits: 0,
//     maximumFractionDigits: 0,
//   }).format(amount);
// };

// export interface Member {
//   id?: string;
//   name?: string;
//   relation_to_proposer?: string;
//   date_of_birth?: string;
//   gender?: string;
//   pre_existing?: boolean;
//   documents?: Array<{
//     id?: string;
//     file_name?: string;
//     document_type?: string;
//   }>;
// }

// interface InfoItemProps {
//   label: string;
//   value: React.ReactNode;
//   icon?: React.ElementType;
// }
// const InfoItem: React.FC<InfoItemProps> = ({ label, value, icon: Icon }) => (
//   <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-md border border-gray-100 hover:bg-gray-100 transition">
//     {Icon && <Icon className="w-4 h-4 mt-1 text-gray-500" />}
//     <div className="flex-1">
//       <div className="text-xs font-medium text-gray-600">{label}</div>
//       <div className="text-base font-semibold text-gray-800">
//         {value || "-"}
//       </div>
//     </div>
//   </div>
// );

// interface PolicyViewProps {
//   policy: Record<string, unknown>;
//   open: boolean;
//   onClose: () => void;
// }

// const statusColors: Record<string, string> = {
//   active: "bg-green-50 text-green-800 border-green-100",
//   expired: "bg-red-50 text-red-800 border-red-100",
//   pending: "bg-yellow-50 text-yellow-800 border-yellow-100",
//   default: "bg-blue-50 text-blue-800 border-blue-100",
// };

// const getStatusColor = (status: string) =>
//   statusColors[status?.toLowerCase()] || statusColors.default;

// const PolicyView: React.FC<PolicyViewProps> = ({ policy, open, onClose }) => {
//   if (!policy) return null;

//   // Add a type guard function for proposer
//   function isProposer(obj: unknown): obj is Record<string, unknown> {
//     return typeof obj === "object" && obj !== null;
//   }

//   // Helper to always return a string
//   function safeString(val: unknown): string {
//     return typeof val === "string" ? val : "-";
//   }

//   // Render proposer section
//   const renderProposerSection = ()  => {
//     if (!isProposer(policy.proposer)) return null;

//     return (
//       <Card className="border border-gray-100 shadow-none bg-white/95">
//         <CardHeader className="bg-gray-50 border-b border-gray-100 rounded-t-lg">
//           <CardTitle className="flex items-center gap-2 text-base font-semibold text-gray-700">
//             <User className="w-5 h-5 text-gray-400" />
//             Proposer Information
//           </CardTitle>
//         </CardHeader>
//         <CardContent className="p-6">
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//             <InfoItem
//               label="Full Name"
//               value={
//                 isProposer(policy.proposer)
//                   ? safeString(policy.proposer.full_name)
//                   : "-"
//               }
//               icon={User}
//             />
//             <InfoItem
//               label="Date of Birth"
//               value={
//                 isProposer(policy.proposer) &&
//                 typeof policy.proposer.date_of_birth === "string"
//                   ? safeString(formatDate(policy.proposer.date_of_birth))
//                   : "-"
//               }
//               icon={Calendar}
//             />
//             <InfoItem
//               label="Gender"
//               value={
//                 isProposer(policy.proposer)
//                   ? safeString(policy.proposer.gender)
//                   : "-"
//               }
//             />
//             <InfoItem
//               label="Marital Status"
//               value={
//                 isProposer(policy.proposer)
//                   ? safeString(policy.proposer.marital_status)
//                   : "-"
//               }
//             />
//             <InfoItem
//               label="Mobile"
//               value={
//                 isProposer(policy.proposer)
//                   ? safeString(policy.proposer.mobile)
//                   : "-"
//               }
//             />
//             <InfoItem
//               label="Email"
//               value={
//                 isProposer(policy.proposer)
//                   ? safeString(policy.proposer.email)
//                   : "-"
//               }
//             />
//             <InfoItem
//               label="Address"
//               value={
//                 isProposer(policy.proposer)
//                   ? safeString(policy.proposer.address)
//                   : "-"
//               }
//             />
//             <InfoItem
//               label="KYC ID"
//               value={
//                 isProposer(policy.proposer)
//                   ? safeString(policy.proposer.kyc_id)
//                   : "-"
//               }
//             />
//             <InfoItem
//               label="Occupation"
//               value={
//                 isProposer(policy.proposer)
//                   ? safeString(policy.proposer.occupation)
//                   : "-"
//               }
//             />
//             <InfoItem
//               label="Nationality"
//               value={
//                 isProposer(policy.proposer)
//                   ? safeString(policy.proposer.nationality)
//                   : "-"
//               }
//             />
//           </div>
//         </CardContent>
//       </Card>
//     );
//   };

//   // Render members section
//   const renderMembersSection = () => {
//     const memberSource = Array.isArray(policy?.proposer?.insured_members)
//       ? (policy.proposer.insured_members as Member[])
//       : [];

//     if (memberSource.length === 0) return null;

//     return (
//       <Card className="border border-gray-100 shadow-none bg-white/95">
//         <CardHeader className="bg-gray-50 border-b border-gray-100 rounded-t-lg">
//           <CardTitle className="flex items-center gap-2 text-base font-semibold text-gray-700">
//             <Users className="w-5 h-5 text-gray-400" />
//             Insured Members ({(policy.members as Member[]).length})
//           </CardTitle>
//         </CardHeader>
//         <CardContent className="p-6">
//           <div className="space-y-5">
//             {memberSource.map((member, idx: number) => {
//               if (typeof member !== "object" || member === null) return null;
//               return (
//                 <div
//                   key={member.id ? safeString(member.id) : safeString(idx)}
//                   className="p-4 bg-gray-50 rounded-md border border-gray-100"
//                 >
//                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//                     <InfoItem
//                       label="Name"
//                       value={safeString(member.name)}
//                       icon={User}
//                     />
//                     <InfoItem
//                       label="Relation"
//                       value={safeString(member.relation_to_proposer)}
//                     />
//                     <InfoItem
//                       label="Date of Birth"
//                       value={safeString(
//                         formatDate(safeString(member.date_of_birth))
//                       )}
//                       icon={Calendar}
//                     />
//                     <InfoItem
//                       label="Gender"
//                       value={safeString(member.gender)}
//                     />
//                     <InfoItem
//                       label="Pre-existing Conditions"
//                       value={
//                         <Badge
//                           className={
//                             member.pre_existing
//                               ? "bg-orange-50 text-orange-800 border border-orange-100"
//                               : "bg-green-50 text-green-800 border border-green-100"
//                           }
//                         >
//                           {member.pre_existing ? "Yes" : "No"}
//                         </Badge>
//                       }
//                     />
//                   </div>
//                   {Array.isArray(member.documents) &&
//                     member.documents.length > 0 && (
//                       <div className="mt-4 p-3 bg-white/70 rounded border border-gray-100">
//                         <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2 text-sm">
//                           <FileText className="w-4 h-4 text-blue-400" />
//                           Documents
//                         </h4>
//                         <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
//                           {(
//                             member.documents as Array<Record<string, unknown>>
//                           ).map((doc, dIdx: number) => (
//                             <div
//                               key={safeString(doc.id) || safeString(dIdx)}
//                               className="flex items-center gap-2 p-2 bg-gray-50 rounded border border-gray-100"
//                             >
//                               <FileText className="w-4 h-4 text-blue-400" />
//                               <span className="text-sm text-gray-700">
//                                 {safeString(doc.file_name)}
//                                 <Badge
//                                   variant="outline"
//                                   className="ml-2 text-xs border-gray-200 text-gray-600"
//                                 >
//                                   {safeString(doc.document_type)}
//                                 </Badge>
//                               </span>
//                             </div>
//                           ))}
//                         </div>
//                       </div>
//                     )}
//                 </div>
//               );
//             })}
//           </div>
//         </CardContent>
//       </Card>
//     );
//   };

//   return (
//     <Dialog open={open} onOpenChange={onClose}>
//       <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto bg-white/90 backdrop-blur border border-gray-200">
//         <DialogHeader className="pb-4 border-b border-gray-100 bg-white/80">
//           <DialogTitle className="flex items-center gap-3 text-xl font-bold text-gray-900">
//             <div className="p-2 bg-blue-50 rounded-lg">
//               <Shield className="w-6 h-6 text-blue-500" />
//             </div>
//             Policy Details
//             <Badge
//               className={`ml-2 border ${getStatusColor(
//                 String(policy.status || "active")
//               )}`}
//             >
//               {String(policy.status || "Active")}
//             </Badge>
//           </DialogTitle>
//         </DialogHeader>

//         <div className="py-6 space-y-8">
//           {/* Basic Information */}
//           <Card className="border border-gray-100 shadow-none bg-white/95">
//             <CardHeader className="bg-gray-50 border-b border-gray-100 rounded-t-lg">
//               <CardTitle className="flex items-center gap-2 text-base font-semibold text-gray-700">
//                 <Building className="w-5 h-5 text-gray-400" />
//                 Basic Information
//               </CardTitle>
//             </CardHeader>
//             <CardContent className="p-6">
//               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//                 <InfoItem
//                   label="Policy Number"
//                   value={String(policy.policy_number)}
//                   icon={FileText}
//                 />
//                 <InfoItem
//                   label="Customer Name"
//                   value={String(policy.customer_name)}
//                   icon={User}
//                 />
//                 <InfoItem
//                   label="Type"
//                   value={
//                     <Badge className="bg-purple-50 text-purple-800 border border-purple-100">
//                       {policy.type &&
//                       typeof policy.type === "object" &&
//                       "name" in policy.type
//                         ? safeString(
//                             (policy.type as Record<string, unknown>).name
//                           )
//                         : safeString(policy.type)}
//                     </Badge>
//                   }
//                 />
//                 {typeof policy.policyName === "object" &&
//                 policy.policyName !== null &&
//                 "name" in policy.policyName ? (
//                   <InfoItem
//                     label="Policy Name"
//                     value={String(
//                       (policy.policyName as Record<string, unknown>).name
//                     )}
//                     icon={FileText}
//                   />
//                 ) : null}
//                 <InfoItem
//                   label="Company"
//                   value={
//                     policy.company &&
//                     typeof policy.company === "object" &&
//                     "name" in policy.company
//                       ? safeString(
//                           (policy.company as Record<string, unknown>).name
//                         )
//                       : "-"
//                   }
//                   icon={Building}
//                 />
//                 <InfoItem
//                   label="Insurer Name"
//                   value={String(policy.insurer_name)}
//                 />
//                 <InfoItem
//                   label="Product Name"
//                   value={String(policy.product_name)}
//                 />
//                 <InfoItem label="Plan Type" value={String(policy.plan_type)} />
//                 <InfoItem
//                   label="Sum Insured"
//                   value={formatCurrency(policy.sum_insured as number)}
//                   icon={IndianRupee}
//                 />
//                 <InfoItem
//                   label="Premium Amount"
//                   value={formatCurrency(policy.premium_amount as number)}
//                   icon={IndianRupee}
//                 />
//                 <InfoItem
//                   label="Tenure Years"
//                   value={`${String(policy.tenure_years) || "-"} years`}
//                   icon={Calendar}
//                 />
//                 <InfoItem
//                   label="Start Date"
//                   value={formatDate(policy.start_date as string)}
//                   icon={Calendar}
//                 />
//                 <InfoItem
//                   label="End Date"
//                   value={formatDate(policy.end_date as string)}
//                   icon={Calendar}
//                 />
//                 <InfoItem
//                   label="Issued Date"
//                   value={formatDate(policy.issued_date as string)}
//                   icon={Calendar}
//                 />
//                 <InfoItem
//                   label="Declaration Accepted"
//                   value={
//                     <Badge
//                       className={
//                         policy.declaration_accepted
//                           ? "bg-green-50 text-green-800 border border-green-100"
//                           : "bg-red-50 text-red-800 border border-red-100"
//                       }
//                     >
//                       {policy.declaration_accepted ? "Yes" : "No"}
//                     </Badge>
//                   }
//                 />
//               </div>
//             </CardContent>
//           </Card>

//           {/* Proposer Information */}
//           {
//           renderProposerSection()
//           }

//           {/* Insured Members */}
//           {
//           renderMembersSection()
//           }

//           {/* Nominee & Payment */}
//           {policy.nominee_payment && (
//             <Card className="border border-gray-100 shadow-none bg-white/95">
//               <CardHeader className="bg-gray-50 border-b border-gray-100 rounded-t-lg">
//                 <CardTitle className="flex items-center gap-2 text-base font-semibold text-gray-700">
//                   <CreditCard className="w-5 h-5 text-gray-400" />
//                   Nominee & Payment Information
//                 </CardTitle>
//               </CardHeader>
//               <CardContent className="p-6">
//                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//                   <InfoItem
//                     label="Nominee Name"
//                     value={
//                       typeof policy.nominee_payment === "object" &&
//                       policy.nominee_payment !== null &&
//                       "nominee_name" in policy.nominee_payment
//                         ? String(
//                             (policy.nominee_payment as Record<string, unknown>)
//                               .nominee_name
//                           )
//                         : "-"
//                     }
//                     icon={User}
//                   />
//                   <InfoItem
//                     label="Relation"
//                     value={
//                       typeof policy.nominee_payment === "object" &&
//                       policy.nominee_payment !== null &&
//                       "nominee_relation" in policy.nominee_payment
//                         ? String(
//                             (policy.nominee_payment as Record<string, unknown>)
//                               .nominee_relation
//                           )
//                         : "-"
//                     }
//                   />
//                   <InfoItem
//                     label="Date of Birth"
//                     value={
//                       typeof policy.nominee_payment === "object" &&
//                       policy.nominee_payment !== null &&
//                       "nominee_dob" in policy.nominee_payment
//                         ? formatDate(
//                             String(
//                               (
//                                 policy.nominee_payment as Record<
//                                   string,
//                                   unknown
//                                 >
//                               ).nominee_dob
//                             )
//                           )
//                         : "-"
//                     }
//                     icon={Calendar}
//                   />
//                   <InfoItem
//                     label="Payment Mode"
//                     value={
//                       <Badge className="bg-blue-50 text-blue-800 border border-blue-100">
//                         {typeof policy.nominee_payment === "object" &&
//                         policy.nominee_payment !== null &&
//                         "payment_mode" in policy.nominee_payment
//                           ? String(
//                               (
//                                 policy.nominee_payment as Record<
//                                   string,
//                                   unknown
//                                 >
//                               ).payment_mode
//                             )
//                           : "-"}
//                       </Badge>
//                     }
//                     icon={CreditCard}
//                   />
//                   <InfoItem
//                     label="Payment Reference"
//                     value={
//                       typeof policy.nominee_payment === "object" &&
//                       policy.nominee_payment !== null &&
//                       "payment_reference" in policy.nominee_payment
//                         ? String(
//                             (policy.nominee_payment as Record<string, unknown>)
//                               .payment_reference
//                           )
//                         : "-"
//                     }
//                   />
//                 </div>
//               </CardContent>
//             </Card>
//           )}

//           {/* Policy Documents */}
//           {policy.documents &&
//             Array.isArray(policy.documents) &&
//             policy.documents.length > 0 && (
//               <Card className="border border-gray-100 shadow-none bg-white/95">
//                 <CardHeader className="bg-gray-50 border-b border-gray-100 rounded-t-lg">
//                   <CardTitle className="flex items-center gap-2 text-base font-semibold text-gray-700">
//                     <FileText className="w-5 h-5 text-gray-400" />
//                     Policy Documents ({policy.documents.length})
//                   </CardTitle>
//                 </CardHeader>
//                 <CardContent className="p-6">
//                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//                     {(policy.documents as Array<Record<string, unknown>>).map(
//                       (doc, idx: number) => (
//                         <div
//                           key={String(doc.id) || idx}
//                           className="flex items-center gap-3 p-4 bg-gray-50 rounded-md border border-gray-100 hover:shadow transition"
//                         >
//                           <div className="p-2 bg-gray-100 rounded-lg">
//                             <FileText className="w-5 h-5 text-teal-500" />
//                           </div>
//                           <div className="flex-1">
//                             <div className="font-semibold text-gray-800">
//                               {String(doc.file_name)}
//                             </div>
//                             <Badge
//                               variant="outline"
//                               className="mt-1 text-xs border-gray-200 text-gray-600"
//                             >
//                               {String(doc.file_type)}
//                             </Badge>
//                           </div>
//                         </div>
//                       )
//                     )}
//                   </div>
//                 </CardContent>
//               </Card>
//             )}
//         </div>
//       </DialogContent>
//     </Dialog>
//   );
// };

// export default PolicyView;
