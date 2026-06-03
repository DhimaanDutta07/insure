"use strict";
// // src/index.ts
// import { logMessage } from "../logger";
// import { TemplateType, WhatsAppService } from "./whatsappService";
// // PO Creation Notification
// export async function sendPOCreationNotification(
//   whatsAppService: WhatsAppService,
//   countryCode: string,
//   phoneNumber: string,
//   documentUrl?: string | null,
//   documentName?: string | null
// ) {
//   const currentDate = new Date().toLocaleDateString("en-US", {
//     year: "numeric",
//     month: "long",
//     day: "numeric",
//   });
//   // Debug logging
//   // console.log('Sending PO notification with document:', {
//   //   documentName,
//   //   documentUrl,
//   //   countryCode,
//   //   phoneNumber
//   // });
//   // Make sure documentUrl uses https protocol
//   let secureDocumentUrl = documentUrl;
//   if (documentUrl && documentUrl.startsWith("http:")) {
//     secureDocumentUrl = documentUrl.replace("http:", "https:");
//     // console.log('Converted document URL to HTTPS:', secureDocumentUrl);
//   }
//   const result = await whatsAppService.sendTemplateMessage({
//     countryCode,
//     phoneNumber,
//     callbackData: `PO Creation - ${currentDate}`,
//     templateType: TemplateType.PO_CREATION,
//     variables: {
//       date: currentDate,
//     },
//     documentUrl: secureDocumentUrl || undefined,
//     documentName: documentName || "Purchase Order.pdf",
//   });
//   logMessage("PO Creation Notification", result, phoneNumber);
//   return result;
// }
// // Quality Approved Notification
// export async function sendQualityApprovedNotification(
//   whatsAppService: WhatsAppService,
//   countryCode: string,
//   phoneNumber: string,
//   truckNo: string,
//   starch: number,
//   moisture: number,
//   tfm: number,
//   remarks: string | null
// ) {
//   const deliveryDate = new Date().toLocaleDateString("en-US", {
//     year: "numeric",
//     month: "long",
//     day: "numeric",
//   });
//   const result = await whatsAppService.sendTemplateMessage({
//     countryCode,
//     phoneNumber,
//     callbackData: `Quality Approved - ${truckNo}`,
//     templateType: TemplateType.QUALITY_APPROVED,
//     variables: {
//       truckNo,
//       deliveryDate,
//       starch: starch,
//       tfm: tfm,
//       moisture: moisture,
//       remarks: remarks,
//     },
//   });
//   logMessage("Quality Approved Notification", result, phoneNumber);
//   return result;
// }
// // Quality Rejected Notification
// export async function sendQualityRejectedNotification(
//   whatsAppService: WhatsAppService,
//   countryCode: string,
//   phoneNumber: string,
//   truckNo: string,
//   starch: number,
//   moisture: number,
//   tfm: number,
//   remarks: string | null
// ) {
//   const deliveryDate = new Date().toLocaleDateString("en-US", {
//     year: "numeric",
//     month: "long",
//     day: "numeric",
//   });
//   const result = await whatsAppService.sendTemplateMessage({
//     countryCode,
//     phoneNumber,
//     callbackData: `Quality Rejected - ${truckNo}`,
//     templateType: TemplateType.QUALITY_REJECTED,
//     variables: {
//       truckNo,
//       deliveryDate,
//       starch: starch,
//       tfm: tfm,
//       moisture: moisture,
//       remarks: remarks,
//     },
//   });
//   logMessage("Quality Rejected Notification", result, phoneNumber);
//   return result;
// }
// // Delivery Confirmation Notification
// export async function sendDeliveryConfirmationNotification(
//   whatsAppService: WhatsAppService,
//   countryCode: string,
//   phoneNumber: string,
//   truckNo: string,
//   net_weight: number,
//   gross_weight: number,
//   tare_weight: number,
//   starch: number,
//   tfm: number,
//   moisture: number,
//   remarks: string | null
// ) {
//   const deliveryDate = new Date().toLocaleDateString("en-US", {
//     year: "numeric",
//     month: "long",
//     day: "numeric",
//   });
//   const result = await whatsAppService.sendTemplateMessage({
//     countryCode,
//     phoneNumber,
//     callbackData: `Delivery Confirmation - ${truckNo}`,
//     templateType: TemplateType.DELIVERY_CONFIRMATION,
//     variables: {
//       truckNo,
//       deliveryDate,
//       net_weight: net_weight,
//       gross_weight: gross_weight,
//       tare_weight: tare_weight,
//       starch: starch,
//       tfm: tfm,
//       moisture: moisture,
//       remarks: remarks,
//     },
//   });
//   logMessage("Delivery Confirmation Notification", result, phoneNumber);
//   return result;
// }
// export async function sendTruckRegistrationNotification(
//   whatsAppService: WhatsAppService,
//   countryCode: string,
//   phoneNumber: string,
//   truckNo: string
// ) {
//   const result = await whatsAppService.sendTemplateMessage({
//     countryCode,
//     phoneNumber,
//     callbackData: `Truck Registration - ${truckNo}`,
//     templateType: TemplateType.TRUCK_REGISTRATION,
//     variables: {
//       truckNo,
//     },
//   });
//   logMessage("Truck Registration Notification", result, phoneNumber);
//   return result;
// }
// // // Reopened for Delivery Notification
// // async function sendReopenedForDeliveryNotification(
// //   whatsAppService: WhatsAppService,
// //   countryCode: string,
// //   phoneNumber: string,
// //   truckNo: string
// // ) {
// //   const deliveryDate = new Date().toLocaleDateString('en-US', {
// //     year: 'numeric',
// //     month: 'long',
// //     day: 'numeric'
// //   });
// //   const result = await whatsAppService.sendTemplateMessage({
// //     countryCode,
// //     phoneNumber,
// //     callbackData: `Reopened for Delivery - ${truckNo}`,
// //     templateType: TemplateType.REOPENED_FOR_DELIVERY,
// //     variables: {
// //       truckNo,
// //       deliveryDate,
// //       net: '12500 kg',
// //       gross: '15000 kg',
// //       tare: '2500 kg',
// //       starch: '24.6%',
// //       tfm: '0.92%',
// //       moisture: '13.1%',
// //       remarks: 'Driver requested re-delivery due to gate closure at destination.'
// //     }
// //   });
// //   logMessage('Reopened for Delivery Notification', result, phoneNumber);
// //   return result;
// // }
// // // Run example notifications
// // // sendExampleNotifications();
