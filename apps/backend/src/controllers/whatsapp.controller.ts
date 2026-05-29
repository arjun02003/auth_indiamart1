import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { sendAIMessage } from '../services/ai/gemini.service';
import { logger } from '../utils/logger';
import { io } from '../index';

export const verifyWebhook = (req: Request, res: Response) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token) {
    if (mode === 'subscribe' && token === process.env.WHATSAPP_WEBHOOK_SECRET) {
      logger.info('WhatsApp Webhook verified!');
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  } else {
    res.sendStatus(400);
  }
};

export const handleIncomingMessage = async (req: Request, res: Response): Promise<void> => {
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
    } else {
      res.sendStatus(404);
    }
  } catch (error) {
    logger.error('WhatsApp Webhook Error:', error);
    res.sendStatus(500);
  }
};

async function processWhatsAppMessage(phone: string, text: string) {
  // Find lead by phone
  let lead = await prisma.lead.findFirst({
    where: { phone: { contains: phone } },
    include: { conversations: true }
  });

  // If no lead, create one
  if (!lead) {
    lead = await prisma.lead.create({
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
    io.emit('lead:new', { lead });
  }

  // Get or create conversation
  let conversation = lead.conversations[0];
  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: { leadId: lead.id, channel: 'WHATSAPP' }
    });
  }

  // Save user message
  const userMessage = await prisma.message.create({
    data: { conversationId: conversation.id, sender: 'CUSTOMER', content: text }
  });
  io.to(`lead-${lead.id}`).emit('message:new', userMessage);

  // Generate AI Response
  const history = await prisma.message.findMany({
    where: { conversationId: conversation.id },
    orderBy: { createdAt: 'asc' }
  });

  const formattedHistory = history.map(m => ({
    role: m.sender === 'CUSTOMER' ? 'user' : 'model',
    parts: [{ text: m.content }]
  })) as any;

  const aiResponse = await sendAIMessage(text, formattedHistory);

  // Save AI message
  const aiMessage = await prisma.message.create({
    data: { conversationId: conversation.id, sender: 'AI', content: aiResponse.message }
  });
  io.to(`lead-${lead.id}`).emit('message:new', aiMessage);

  // Update lead status
  await prisma.lead.update({
    where: { id: lead.id },
    data: { status: 'REQUIREMENT_GATHERING', lastContactedAt: new Date() }
  });

  // Send back to WhatsApp
  const { sendWhatsAppMessage } = await import('../services/whatsapp/whatsapp.service');
  await sendWhatsAppMessage(phone, aiResponse.message);
}
