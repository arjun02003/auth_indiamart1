import axios from 'axios';
import { logger } from '../../utils/logger';

const WA_TOKEN = process.env.WHATSAPP_API_TOKEN;
const PHONE_ID = process.env.WHATSAPP_PHONE_ID;
const API_VERSION = 'v18.0';

const baseURL = `https://graph.facebook.com/${API_VERSION}/${PHONE_ID}/messages`;

const waClient = axios.create({
  baseURL,
  headers: {
    Authorization: `Bearer ${WA_TOKEN}`,
    'Content-Type': 'application/json',
  },
});

export async function sendWhatsAppMessage(to: string, text: string): Promise<void> {
  if (!WA_TOKEN || !PHONE_ID) {
    logger.warn('WhatsApp API not configured, skipping message send.');
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
    logger.info(`WhatsApp message sent to ${to}`);
  } catch (error: any) {
    logger.error('WhatsApp send failed:', error.response?.data || error.message);
    throw error;
  }
}

export async function sendWhatsAppQuotationTemplate(to: string, quotationNumber: string, grandTotal: number, pdfUrl: string): Promise<void> {
  if (!WA_TOKEN || !PHONE_ID) return;

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
    logger.info(`WhatsApp quotation sent to ${to}`);
  } catch (error: any) {
    logger.error('WhatsApp template send failed:', error.response?.data || error.message);
    throw error;
  }
}
