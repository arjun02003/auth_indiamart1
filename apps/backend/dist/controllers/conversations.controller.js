"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.agentReply = exports.createConversation = exports.sendMessage = exports.getConversationById = exports.getConversations = void 0;
const prisma_1 = require("../utils/prisma");
const gemini_service_1 = require("../services/ai/gemini.service");
const index_1 = require("../index");
const express_1 = require("../utils/express");
const getConversations = async (req, res) => {
    try {
        const { leadId } = req.query;
        const conversations = await prisma_1.prisma.conversation.findMany({
            where: leadId ? { leadId: leadId } : {},
            include: {
                lead: { select: { id: true, name: true, company: true, phone: true, temperature: true, qualificationScore: true } },
                messages: { orderBy: { createdAt: 'desc' }, take: 1 },
                _count: { select: { messages: true } },
            },
            orderBy: { updatedAt: 'desc' },
        });
        res.json(conversations);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch conversations' });
    }
};
exports.getConversations = getConversations;
const getConversationById = async (req, res) => {
    try {
        const conversationId = (0, express_1.getRouteParam)(req.params.id);
        if (!conversationId) {
            res.status(400).json({ error: 'Conversation id is required' });
            return;
        }
        const conversation = await prisma_1.prisma.conversation.findUnique({
            where: { id: conversationId },
            include: {
                lead: true,
                messages: { orderBy: { createdAt: 'asc' } },
            },
        });
        if (!conversation) {
            res.status(404).json({ error: 'Conversation not found' });
            return;
        }
        res.json(conversation);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch conversation' });
    }
};
exports.getConversationById = getConversationById;
const sendMessage = async (req, res) => {
    try {
        const conversationId = (0, express_1.getRouteParam)(req.params.conversationId);
        if (!conversationId) {
            res.status(400).json({ error: 'Conversation id is required' });
            return;
        }
        const { content, useAI = true } = req.body;
        const conversation = await prisma_1.prisma.conversation.findUnique({
            where: { id: conversationId },
            include: {
                lead: true,
                messages: { orderBy: { createdAt: 'asc' } },
            },
        });
        if (!conversation) {
            res.status(404).json({ error: 'Conversation not found' });
            return;
        }
        // Save human/customer message
        const userMessage = await prisma_1.prisma.message.create({
            data: {
                conversationId,
                sender: 'CUSTOMER',
                content,
            },
        });
        index_1.io.to(`lead-${conversation.leadId}`).emit('message:new', userMessage);
        let aiMessage = null;
        if (useAI) {
            // Build conversation history for Gemini
            const history = conversation.messages.map((m) => ({
                role: m.sender === 'CUSTOMER' ? 'user' : 'model',
                parts: [{ text: m.content }],
            }));
            // Get AI response
            const aiResponse = await (0, gemini_service_1.sendAIMessage)(content, history);
            aiMessage = await prisma_1.prisma.message.create({
                data: {
                    conversationId,
                    sender: 'AI',
                    content: aiResponse.message,
                },
            });
            index_1.io.to(`lead-${conversation.leadId}`).emit('message:new', aiMessage);
            // Update lead activity
            await prisma_1.prisma.lead.update({
                where: { id: conversation.leadId },
                data: { lastContactedAt: new Date(), status: 'REQUIREMENT_GATHERING' },
            });
        }
        await prisma_1.prisma.conversation.update({ where: { id: conversationId }, data: { updatedAt: new Date() } });
        res.json({ userMessage, aiMessage });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to send message', details: String(error) });
    }
};
exports.sendMessage = sendMessage;
const createConversation = async (req, res) => {
    try {
        const { leadId, channel = 'CHAT' } = req.body;
        const lead = await prisma_1.prisma.lead.findUnique({ where: { id: leadId } });
        if (!lead) {
            res.status(404).json({ error: 'Lead not found' });
            return;
        }
        const conversation = await prisma_1.prisma.conversation.create({
            data: { leadId, channel },
            include: { lead: { select: { id: true, name: true, company: true } } },
        });
        // Auto-greeting from AI
        if (lead.indiamartQuery) {
            const aiResponse = await (0, gemini_service_1.sendAIMessage)(lead.indiamartQuery, []);
            await prisma_1.prisma.message.create({
                data: { conversationId: conversation.id, sender: 'AI', content: aiResponse.message },
            });
        }
        res.status(201).json(conversation);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to create conversation' });
    }
};
exports.createConversation = createConversation;
const agentReply = async (req, res) => {
    try {
        const conversationId = (0, express_1.getRouteParam)(req.params.conversationId);
        if (!conversationId) {
            res.status(400).json({ error: 'Conversation id is required' });
            return;
        }
        const { content } = req.body;
        const message = await prisma_1.prisma.message.create({
            data: { conversationId, sender: 'AGENT', content, sentById: req.user.id },
        });
        await prisma_1.prisma.conversation.update({ where: { id: conversationId }, data: { updatedAt: new Date() } });
        const conv = await prisma_1.prisma.conversation.findUnique({ where: { id: conversationId } });
        if (conv)
            index_1.io.to(`lead-${conv.leadId}`).emit('message:new', message);
        res.json(message);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to send agent reply' });
    }
};
exports.agentReply = agentReply;
//# sourceMappingURL=conversations.controller.js.map