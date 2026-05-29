"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleIncomingMessage = exports.verifyWebhook = void 0;
const prisma_1 = require("../utils/prisma");
const gemini_service_1 = require("../services/ai/gemini.service");
const logger_1 = require("../utils/logger");
const index_1 = require("../index");
const verifyWebhook = (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    if (mode && token) {
        if (mode === 'subscribe' && token === process.env.WHATSAPP_WEBHOOK_SECRET) {
            logger_1.logger.info('WhatsApp Webhook verified!');
            res.status(200).send(challenge);
        }
        else {
            res.sendStatus(403);
        }
    }
    else {
        res.sendStatus(400);
    }
};
exports.verifyWebhook = verifyWebhook;
const handleIncomingMessage = async (req, res) => {
    try {
        const body = req.body;
        if (body.object === 'whatsapp_business_account') {
            for (const entry of body.entry) {
                for (const change of entry.changes) {
                    if (change.value.messages && change.value.messages[0]) {
                        const msg = change.value.messages[0];
                        const phone = msg.from;
                        const text = msg.text?.body;
                        if (text) {
                            await processWhatsAppMessage(phone, text);
                        }
                    }
                }
            }
            res.sendStatus(200);
        }
        else {
            res.sendStatus(404);
        }
    }
    catch (error) {
        logger_1.logger.error('WhatsApp Webhook Error:', error);
        res.sendStatus(500);
    }
};
exports.handleIncomingMessage = handleIncomingMessage;
async function processWhatsAppMessage(phone, text) {
    // Find lead by phone
    let lead = await prisma_1.prisma.lead.findFirst({
        where: { phone: { contains: phone } },
        include: { conversations: true }
    });
    // If no lead, create one
    if (!lead) {
        lead = await prisma_1.prisma.lead.create({
            data: {
                name: 'WhatsApp User',
                phone,
                source: 'WHATSAPP',
                status: 'NEW',
                temperature: 'COLD',
            },
            include: { conversations: true }
        });
        // Alert frontend
        index_1.io.emit('lead:new', { lead });
    }
    // Get or create conversation
    let conversation = lead.conversations[0];
    if (!conversation) {
        conversation = await prisma_1.prisma.conversation.create({
            data: { leadId: lead.id, channel: 'WHATSAPP' }
        });
    }
    // Save user message
    const userMessage = await prisma_1.prisma.message.create({
        data: { conversationId: conversation.id, sender: 'CUSTOMER', content: text }
    });
    index_1.io.to(`lead-${lead.id}`).emit('message:new', userMessage);
    // Generate AI Response
    const history = await prisma_1.prisma.message.findMany({
        where: { conversationId: conversation.id },
        orderBy: { createdAt: 'asc' }
    });
    const formattedHistory = history.map(m => ({
        role: m.sender === 'CUSTOMER' ? 'user' : 'model',
        parts: [{ text: m.content }]
    }));
    const aiResponse = await (0, gemini_service_1.sendAIMessage)(text, formattedHistory);
    // Save AI message
    const aiMessage = await prisma_1.prisma.message.create({
        data: { conversationId: conversation.id, sender: 'AI', content: aiResponse.message }
    });
    index_1.io.to(`lead-${lead.id}`).emit('message:new', aiMessage);
    // Update lead status
    await prisma_1.prisma.lead.update({
        where: { id: lead.id },
        data: { status: 'REQUIREMENT_GATHERING', lastContactedAt: new Date() }
    });
    // Send back to WhatsApp
    const { sendWhatsAppMessage } = await Promise.resolve().then(() => __importStar(require('../services/whatsapp/whatsapp.service')));
    await sendWhatsAppMessage(phone, aiResponse.message);
}
//# sourceMappingURL=whatsapp.controller.js.map