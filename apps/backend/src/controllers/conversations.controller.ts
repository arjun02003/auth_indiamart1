import { Response } from 'express';
import { prisma } from '../utils/prisma';
import { AuthRequest } from '../middleware/auth.middleware';
import { sendAIMessage, ChatMessage } from '../services/ai/gemini.service';
import { io } from '../index';
import { getRouteParam } from '../utils/express';

export const getConversations = async (req: Request, res: Response): Promise<void> => {
  try {
    const { leadId } = req.query;
    const conversations = await prisma.conversation.findMany({
      where: leadId ? { leadId: leadId as string } : {},
      include: {
        lead: { select: { id: true, name: true, company: true, phone: true, temperature: true, qualificationScore: true } },
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
        _count: { select: { messages: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
    res.json(conversations);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
};

export const getConversationById = async (req: Request, res: Response): Promise<void> => {
  try {
    const conversationId = getRouteParam(req.params.id);
    if (!conversationId) { res.status(400).json({ error: 'Conversation id is required' }); return; }

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        lead: true,
        messages: { orderBy: { createdAt: 'asc' } },
      },
    });
    if (!conversation) { res.status(404).json({ error: 'Conversation not found' }); return; }
    res.json(conversation);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch conversation' });
  }
};

export const sendMessage = async (req: Request, res: Response): Promise<void> => {
  try {
    const conversationId = getRouteParam(req.params.conversationId);
    if (!conversationId) { res.status(400).json({ error: 'Conversation id is required' }); return; }

    const { content, useAI = true } = req.body;

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        lead: true,
        messages: { orderBy: { createdAt: 'asc' } },
      },
    });
    if (!conversation) { res.status(404).json({ error: 'Conversation not found' }); return; }

    // Save human/customer message
    const userMessage = await prisma.message.create({
      data: {
        conversationId,
        sender: 'CUSTOMER',
        content,
      },
    });

    io.to(`lead-${conversation.leadId}`).emit('message:new', userMessage);

    let aiMessage = null;

    if (useAI) {
      // Build conversation history for Gemini
      const history: ChatMessage[] = conversation.messages.map((m): ChatMessage => ({
        role: m.sender === 'CUSTOMER' ? 'user' : 'model',
        parts: [{ text: m.content }],
      }));

      // Get AI response
      const aiResponse = await sendAIMessage(content, history);

      aiMessage = await prisma.message.create({
        data: {
          conversationId,
          sender: 'AI',
          content: aiResponse.message,
        },
      });

      io.to(`lead-${conversation.leadId}`).emit('message:new', aiMessage);

      // Update lead activity
      await prisma.lead.update({
        where: { id: conversation.leadId },
        data: { lastContactedAt: new Date(), status: 'REQUIREMENT_GATHERING' },
      });
    }

    await prisma.conversation.update({ where: { id: conversationId }, data: { updatedAt: new Date() } });

    res.json({ userMessage, aiMessage });
  } catch (error) {
    res.status(500).json({ error: 'Failed to send message', details: String(error) });
  }
};

export const createConversation = async (req: Request, res: Response): Promise<void> => {
  try {
    const { leadId, channel = 'CHAT' } = req.body;
    const lead = await prisma.lead.findUnique({ where: { id: leadId } });
    if (!lead) { res.status(404).json({ error: 'Lead not found' }); return; }

    const conversation = await prisma.conversation.create({
      data: { leadId, channel },
      include: { lead: { select: { id: true, name: true, company: true } } },
    });

    // Auto-greeting from AI
    if (lead.indiamartQuery) {
      const aiResponse = await sendAIMessage(lead.indiamartQuery, []);
      await prisma.message.create({
        data: { conversationId: conversation.id, sender: 'AI', content: aiResponse.message },
      });
    }

    res.status(201).json(conversation);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create conversation' });
  }
};

export const agentReply = async (req: Request, res: Response): Promise<void> => {
  try {
    const conversationId = getRouteParam(req.params.conversationId);
    if (!conversationId) { res.status(400).json({ error: 'Conversation id is required' }); return; }
    const { content } = req.body;

    const message = await prisma.message.create({
      data: { conversationId, sender: 'AGENT', content, sentById: 'system' },
    });

    await prisma.conversation.update({ where: { id: conversationId }, data: { updatedAt: new Date() } });

    const conv = await prisma.conversation.findUnique({ where: { id: conversationId } });
    if (conv) io.to(`lead-${conv.leadId}`).emit('message:new', message);

    res.json(message);
  } catch (error) {
    res.status(500).json({ error: 'Failed to send agent reply' });
  }
};
