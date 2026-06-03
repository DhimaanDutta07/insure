"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhatsAppService = exports.TemplateType = void 0;
// src/services/whatsappService.ts
const axios_1 = __importDefault(require("axios"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
var TemplateType;
(function (TemplateType) {
    TemplateType["PO_CREATION"] = "po_creation";
    TemplateType["QUALITY_APPROVED"] = "quality_approved";
    TemplateType["QUALITY_REJECTED"] = "quality_rejected";
    TemplateType["DELIVERY_CONFIRMATION"] = "delivery_confirmed";
    TemplateType["REOPENED_FOR_DELIVERY"] = "reopened_for_delivery";
    TemplateType["TRUCK_REGISTRATION"] = "truckregistration";
})(TemplateType || (exports.TemplateType = TemplateType = {}));
class WhatsAppService {
    constructor() {
        this.apiUrl = 'https://api.interakt.ai/v1/public/message/';
        // Get API key from environment variables
        this.apiKey = process.env.INTERAKT_API_KEY || '';
        if (!this.apiKey) {
            throw new Error('INTERAKT_API_KEY is not defined in the environment variables');
        }
    }
    /**
     * Send WhatsApp template message
     * @param options Message options including template type and variables
     * @returns Response from the API
     */
    async sendTemplateMessage(options) {
        const { countryCode, phoneNumber, callbackData, templateType, language = 'en', variables, documentUrl, documentName } = options;
        console.log(variables, "Variables");
        console.log(templateType, "template type");
        // Prepare bodyValues based on template type
        const bodyValues = this.prepareBodyValues(templateType, variables);
        console.log(bodyValues, "bodyValues");
        // Prepare the data payload
        const data = {
            countryCode,
            phoneNumber,
            callbackData,
            type: 'Template',
            template: {
                name: templateType,
                languageCode: language,
                bodyValues
            }
        };
        // console.log(documentUrl);
        // Add document if provided
        if (documentUrl) {
            data.template.headerValues = [documentUrl]; // Use headerValues for media URL
            // Optionally, if the template also supports filename, you might need components too
            data.template.components = [
                {
                    type: 'header',
                    parameters: [
                        {
                            type: 'document',
                            document: {
                                link: documentUrl,
                                filename: documentName || 'document.pdf'
                            }
                        }
                    ]
                }
            ];
        }
        try {
            console.log('Sending WhatsApp message payload:', JSON.stringify(data, null, 2));
            // Send the request
            const response = await axios_1.default.post(this.apiUrl, data, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Basic ${this.apiKey}`
                }
            });
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
     * Prepare bodyValues array based on template type
     * @param templateType Type of template
     * @param variables Variables for the template
     * @returns Array of body values in correct order for the template
     */
    prepareBodyValues(templateType, variables) {
        switch (templateType) {
            case TemplateType.PO_CREATION:
                return [variables.date];
            case TemplateType.QUALITY_APPROVED:
                return [
                    variables.truckNo,
                    variables.deliveryDate,
                    variables.starch,
                    variables.tfm,
                    variables.moisture,
                    variables.remarks
                ];
            case TemplateType.QUALITY_REJECTED:
                return [
                    variables.truckNo,
                    variables.deliveryDate,
                    variables.starch,
                    variables.tfm,
                    variables.moisture,
                    variables.remarks
                ];
            case TemplateType.DELIVERY_CONFIRMATION:
                return [
                    variables.truckNo,
                    variables.deliveryDate,
                    variables.net_weight,
                    variables.gross_weight,
                    variables.tare_weight,
                    variables.starch,
                    variables.tfm,
                    variables.moisture,
                    variables.remarks
                ];
            case TemplateType.REOPENED_FOR_DELIVERY:
                return [
                    variables.truckNo,
                    variables.deliveryDate,
                    variables.net,
                    variables.gross,
                    variables.tare,
                    variables.starch,
                    variables.tfm,
                    variables.moisture,
                    variables.remarks
                ];
            case TemplateType.TRUCK_REGISTRATION:
                return [
                    variables.truckNo
                ];
            default:
                throw new Error(`Unsupported template type: ${templateType}`);
        }
    }
}
exports.WhatsAppService = WhatsAppService;
