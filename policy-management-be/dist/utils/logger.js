"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logMessage = logMessage;
// src/utils/logger.ts
/**
 * Log message status to console
 * @param notificationType Type of notification sent
 * @param result API response
 * @param phoneNumber Recipient phone number
 */
function logMessage(notificationType, result, phoneNumber) {
    const timestamp = new Date().toISOString();
    if (result.error) {
        console.error(`[${timestamp}] ${notificationType} FAILED to ${phoneNumber}: ${JSON.stringify(result.error)}`);
    }
    else {
        console.log(`[${timestamp}] ${notificationType} SENT to ${phoneNumber}: Message ID: ${result.id || 'N/A'}`);
    }
}
