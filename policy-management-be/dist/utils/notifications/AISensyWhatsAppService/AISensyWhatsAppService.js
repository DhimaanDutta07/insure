"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AisensyWhatsAppService = exports.TemplateType = void 0;
const axios_1 = __importDefault(require("axios"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
var TemplateType;
(function (TemplateType) {
    TemplateType["PO_CONFIRMATION"] = "po_confirmation1";
    TemplateType["QUALITY_APPROVED"] = "quality_approved1";
    TemplateType["QUALITY_REJECTED"] = "qualityrejected";
    TemplateType["DELIVERY_CONFIRMATION"] = "deliveryconfirmed";
})(TemplateType || (exports.TemplateType = TemplateType = {}));
class AisensyWhatsAppService {
    constructor() {
        this.apiUrl = 'https://backend.aisensy.com/campaign/t1/api/v2';
        // Map of template types to campaign names - replace these with your actual campaign names
        this.campaignMap = {
            [TemplateType.PO_CONFIRMATION]: 'po_confirmation_campaign',
            [TemplateType.QUALITY_APPROVED]: 'quality_approved_campaign',
            [TemplateType.QUALITY_REJECTED]: 'quality_rejected_campaign',
            [TemplateType.DELIVERY_CONFIRMATION]: 'delivery_confirmation_campaign'
        };
        // Get API key from environment variables
        this.apiKey = process.env.AISENSY_API_KEY || '';
        if (!this.apiKey) {
            throw new Error('AISENSY_API_KEY is not defined in the environment variables');
        }
    }
    /**
     * Send WhatsApp template message via Aisensy
     * @param options Message options including template name and variables
     * @returns Response from the API
     */
    async sendTemplateMessage(options) {
        const { phoneNumber, templateName, campaignName, variables, documentUrl, documentName } = options;
        // Format phone number (ensure it has country code)
        const formattedPhoneNumber = this.formatPhoneNumber(phoneNumber);
        // Get template parameters based on variables and template type
        const templateParams = this.getTemplateParams(templateName, variables);
        // Define media object if document is provided
        let media = undefined;
        if (documentUrl && documentName) {
            media = {
                url: documentUrl,
                filename: documentName
            };
        }
        // Use the provided campaign name or get it from the map
        const actualCampaignName = campaignName || this.campaignMap[templateName];
        if (!actualCampaignName) {
            throw new Error(`No campaign name defined for template: ${templateName}`);
        }
        // Prepare the data payload according to the API documentation
        const data = {
            apiKey: this.apiKey,
            campaignName: actualCampaignName,
            destination: formattedPhoneNumber,
            userName: variables.userName || "Customer",
            source: "API",
            media: media,
            templateParams: templateParams
        };
        try {
            console.log('Sending WhatsApp message payload:', JSON.stringify(data, null, 2));
            // Send the request
            const response = await axios_1.default.post(this.apiUrl, data, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            console.log(response.data);
            return response.data;
        }
        catch (error) {
            if (error instanceof Error) {
                if ('response' in error && typeof error.response === 'object' && error.response) {
                    const axiosError = error.response;
                    console.error('Error sending WhatsApp message:', axiosError.data || error.message);
                    return { error: axiosError.data || error.message };
                }
                return { error: error.message };
            }
            console.error('Error sending WhatsApp message:', error);
            return { error: 'Unknown error occurred' };
        }
    }
    /**
     * Format phone number to ensure it has country code
     * @param phoneNumber Phone number to format
     * @returns Formatted phone number
     */
    formatPhoneNumber(phoneNumber) {
        // If phone number already has country code (starts with +), return as is
        if (phoneNumber.startsWith('+')) {
            return phoneNumber;
        }
        // If phone number starts with country code numbers (e.g., 91), add + prefix
        if (/^\d{1,3}\d+$/.test(phoneNumber)) {
            return `+${phoneNumber}`;
        }
        // Default to adding Indian country code if none provided
        return `+91${phoneNumber}`;
    }
    /**
     * Get template parameters array based on template type and variables
     * @param templateName Name of the template
     * @param variables Variables for the template
     * @returns Array of template parameters
     */
    getTemplateParams(templateName, variables) {
        // Create an array of strings to be used as templateParams
        const params = [];
        switch (templateName) {
            case TemplateType.PO_CONFIRMATION:
                params.push(variables.date || new Date().toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                }));
                break;
            case TemplateType.QUALITY_APPROVED:
                params.push(variables.truckNo || "");
                params.push(variables.deliveryDate || "");
                params.push(variables.starch?.toString() || "");
                params.push(variables.tfm?.toString() || "");
                params.push(variables.moisture?.toString() || "");
                params.push(variables.remarks || "No remarks");
                break;
            case TemplateType.QUALITY_REJECTED:
                params.push(variables.truckNo || "");
                params.push(variables.deliveryDate || "");
                params.push(variables.starch?.toString() || "");
                params.push(variables.tfm?.toString() || "");
                params.push(variables.moisture?.toString() || "");
                params.push(variables.remarks || "No remarks");
                break;
            case TemplateType.DELIVERY_CONFIRMATION:
                params.push(variables.truckNo || "");
                params.push(variables.deliveryDate || "");
                params.push(variables.net_weight?.toString() || "");
                params.push(variables.gross_weight?.toString() || "");
                params.push(variables.tare_weight?.toString() || "");
                params.push(variables.starch?.toString() || "");
                params.push(variables.tfm?.toString() || "");
                params.push(variables.moisture?.toString() || "");
                params.push(variables.remarks || "No remarks");
                break;
            default:
                throw new Error(`Unsupported template type: ${templateName}`);
        }
        return params;
    }
}
exports.AisensyWhatsAppService = AisensyWhatsAppService;
