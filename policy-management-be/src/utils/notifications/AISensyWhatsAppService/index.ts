import { logMessage } from '../../logger';
import { AisensyWhatsAppService, TemplateType } from './AISensyWhatsAppService';

// PO Confirmation Notification
export async function sendPOConfirmationNotification(
  aisensyService: AisensyWhatsAppService, 
  phoneNumber: string,
  documentUrl?: string | null,
  documentName?: string | null
) {
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
    templateName: TemplateType.PO_CONFIRMATION,
    campaignName:"VRV_po_confirmation",
    variables: {
      date: currentDate,
      userName: "Customer" // Adding a userName for the contact
    },
    documentUrl: secureDocumentUrl || undefined,
    documentName: documentName || 'Purchase Order.pdf'
  });
  
  logMessage('PO Confirmation Notification', result, phoneNumber);
  return result;
}

// Quality Approved Notification
export async function sendQualityApprovedNotification(
  aisensyService: AisensyWhatsAppService, 
  phoneNumber: string, 
  truckNo: string,
  starch: number,
  moisture: number,
  tfm: number,
  remarks: string | null
) {
  const deliveryDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  const result = await aisensyService.sendTemplateMessage({
    phoneNumber,
    templateName: TemplateType.QUALITY_APPROVED,
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
  
  logMessage('Quality Approved Notification', result, phoneNumber);
  return result;
}

// Quality Rejected Notification
export async function sendQualityRejectedNotification(
  aisensyService: AisensyWhatsAppService, 
  phoneNumber: string, 
  truckNo: string,
  starch: number,
  moisture: number,
  tfm: number,
  remarks: string | null
) {
  const deliveryDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  const result = await aisensyService.sendTemplateMessage({
    phoneNumber,
    templateName: TemplateType.QUALITY_REJECTED,
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
  
  logMessage('Quality Rejected Notification', result, phoneNumber);
  return result;
}

// Delivery Confirmation Notification
export async function sendDeliveryConfirmationNotification(
  aisensyService: AisensyWhatsAppService, 
  phoneNumber: string, 
  truckNo: string,
  net_weight: number,
  gross_weight: number,
  tare_weight: number,
  starch: number,
  tfm: number,
  moisture: number,
  remarks: string | null
) {
  const deliveryDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  const result = await aisensyService.sendTemplateMessage({
    phoneNumber,
    templateName: TemplateType.DELIVERY_CONFIRMATION,
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
  
  logMessage('Delivery Confirmation Notification', result, phoneNumber);
  return result;
}

// Example usage
export async function sendExampleNotifications() {
  try {
    const aisensyService = new AisensyWhatsAppService();
    
    // Example 1: PO Confirmation
    await sendPOConfirmationNotification(
      aisensyService, 
      '9999999999', 
      'https://example.com/documents/po-123456.pdf'
    );
    
    // Example 2: Quality Approved
    await sendQualityApprovedNotification(
      aisensyService, 
      '9999999999', 
      'TRK-789',
      76,
      76,
      45,
      'Quality is degraded'
    );
    
    // Example 3: Quality Rejected
    await sendQualityRejectedNotification(
      aisensyService, 
      '9999999999', 
      'TRK-456',
      75,
      345,
      86,
      'Quality is degraded'
    );
    
    // Example 4: Delivery Confirmation
    await sendDeliveryConfirmationNotification(
      aisensyService, 
      '9999999999', 
      'TRK-101',
      75,
      86,
      345,
      76,
      45,
      34,
      'Quality is degraded'
    );
    
  } catch (error) {
    console.error('Error in sending notifications:', error);
  }
}