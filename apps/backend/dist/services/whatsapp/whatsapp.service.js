"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendWhatsAppMessage = sendWhatsAppMessage;
exports.sendWhatsAppQuotationTemplate = sendWhatsAppQuotationTemplate;
const axios_1 = __importDefault(require("axios"));
const logger_1 = require("../../utils/logger");
const WA_TOKEN = process.env.WHATSAPP_API_TOKEN;
const PHONE_ID = process.env.WHATSAPP_PHONE_ID;
const API_VERSION = 'v18.0';
const baseURL = `https://graph.facebook.com/${API_VERSION}/${PHONE_ID}/messages`;
const waClient = axios_1.default.create({
    baseURL,
    headers: {
        Authorization: `Bearer ${WA_TOKEN}`,
        'Content-Type': 'application/json',
    },
});
async function sendWhatsAppMessage(to, text) {
    if (!WA_TOKEN || !PHONE_ID) {
        logger_1.logger.warn('WhatsApp API not configured, skipping message send.');
        return;
    }
    try {
        await waClient.post('', {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to,
            type: 'text',
            text: { body: text },
        });
        logger_1.logger.info(`WhatsApp message sent to ${to}`);
    }
    catch (error) {
        logger_1.logger.error('WhatsApp send failed:', error.response?.data || error.message);
        throw error;
    }
}
async function sendWhatsAppQuotationTemplate(to, quotationNumber, grandTotal, pdfUrl) {
    if (!WA_TOKEN || !PHONE_ID)
        return;
    try {
        await waClient.post('', {
            messaging_product: 'whatsapp',
            to,
            type: 'template',
            template: {
                name: 'send_quotation', // Must be an approved template in Meta Dashboard
                language: { code: 'en' },
                components: [
                    {
                        type: 'header',
                        parameters: [
                            {
                                type: 'document',
                                document: {
                                    link: pdfUrl,
                                    filename: `Quotation_${quotationNumber}.pdf`
                                }
                            }
                        ]
                    },
                    {
                        type: 'body',
                        parameters: [
                            { type: 'text', text: quotationNumber },
                            { type: 'text', text: `₹${new Intl.NumberFormat('en-IN').format(grandTotal)}` }
                        ]
                    }
                ]
            }
        });
        logger_1.logger.info(`WhatsApp quotation sent to ${to}`);
    }
    catch (error) {
        logger_1.logger.error('WhatsApp template send failed:', error.response?.data || error.message);
        throw error;
    }
}
//# sourceMappingURL=whatsapp.service.js.map