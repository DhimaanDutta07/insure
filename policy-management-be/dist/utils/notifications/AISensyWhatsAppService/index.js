"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendPOConfirmationNotification = sendPOConfirmationNotification;
exports.sendQualityApprovedNotification = sendQualityApprovedNotification;
exports.sendQualityRejectedNotification = sendQualityRejectedNotification;
exports.sendDeliveryConfirmationNotification = sendDeliveryConfirmationNotification;
exports.sendExampleNotifications = sendExampleNotifications;
const logger_1 = require("../../logger");
const AISensyWhatsAppService_1 = require("./AISensyWhatsAppService");
// PO Confirmation Notification
async function sendPOConfirmationNotification(aisensyService, phoneNumber, documentUrl, documentName) {
    const currentDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    // Make sure documentUrl uses https protocol
    let secureDocumentUrl = documentUrl;
    if (documentUrl && documentUrl.startsWith('http:')) {
        secureDocumentUrl = documentUrl.replace('http:', 'https:');
    }
    const result = await aisensyService.sendTemplateMessage({
        phoneNumber,
        templateName: AISensyWhatsAppService_1.TemplateType.PO_CONFIRMATION,
        campaignName: "VRV_po_confirmation",
        variables: {
            date: currentDate,
            userName: "Customer" // Adding a userName for the contact
        },
        documentUrl: secureDocumentUrl || undefined,
        documentName: documentName || 'Purchase Order.pdf'
    });
    (0, logger_1.logMessage)('PO Confirmation Notification', result, phoneNumber);
    return result;
}
// Quality Approved Notification
async function sendQualityApprovedNotification(aisensyService, phoneNumber, truckNo, starch, moisture, tfm, remarks) {
    const deliveryDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    const result = await aisensyService.sendTemplateMessage({
        phoneNumber,
        templateName: AISensyWhatsAppService_1.TemplateType.QUALITY_APPROVED,
        variables: {
            userName: "Customer",
            truckNo,
            deliveryDate,
            starch,
            tfm,
            moisture,
            remarks: remarks || "Quality check completed"
        }
    });
    (0, logger_1.logMessage)('Quality Approved Notification', result, phoneNumber);
    return result;
}
// Quality Rejected Notification
async function sendQualityRejectedNotification(aisensyService, phoneNumber, truckNo, starch, moisture, tfm, remarks) {
    const deliveryDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    const result = await aisensyService.sendTemplateMessage({
        phoneNumber,
        templateName: AISensyWhatsAppService_1.TemplateType.QUALITY_REJECTED,
        variables: {
            userName: "Customer",
            truckNo,
            deliveryDate,
            starch,
            tfm,
            moisture,
            remarks: remarks || "Quality check failed"
        }
    });
    (0, logger_1.logMessage)('Quality Rejected Notification', result, phoneNumber);
    return result;
}
// Delivery Confirmation Notification
async function sendDeliveryConfirmationNotification(aisensyService, phoneNumber, truckNo, net_weight, gross_weight, tare_weight, starch, tfm, moisture, remarks) {
    const deliveryDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    const result = await aisensyService.sendTemplateMessage({
        phoneNumber,
        templateName: AISensyWhatsAppService_1.TemplateType.DELIVERY_CONFIRMATION,
        variables: {
            userName: "Customer",
            truckNo,
            deliveryDate,
            net_weight,
            gross_weight,
            tare_weight,
            starch,
            tfm,
            moisture,
            remarks: remarks || "Delivery completed"
        }
    });
    (0, logger_1.logMessage)('Delivery Confirmation Notification', result, phoneNumber);
    return result;
}
// Example usage
async function sendExampleNotifications() {
    try {
        const aisensyService = new AISensyWhatsAppService_1.AisensyWhatsAppService();
        // Example 1: PO Confirmation
        await sendPOConfirmationNotification(aisensyService, '9999999999', 'https://example.com/documents/po-123456.pdf');
        // Example 2: Quality Approved
        await sendQualityApprovedNotification(aisensyService, '9999999999', 'TRK-789', 76, 76, 45, 'Quality is degraded');
        // Example 3: Quality Rejected
        await sendQualityRejectedNotification(aisensyService, '9999999999', 'TRK-456', 75, 345, 86, 'Quality is degraded');
        // Example 4: Delivery Confirmation
        await sendDeliveryConfirmationNotification(aisensyService, '9999999999', 'TRK-101', 75, 86, 345, 76, 45, 34, 'Quality is degraded');
    }
    catch (error) {
        console.error('Error in sending notifications:', error);
    }
}
