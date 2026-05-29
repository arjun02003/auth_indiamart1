import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { qualifyLead, generateAutoReply } from '../services/ai/gemini.service';
import { sendWelcomeEmail } from '../services/email/email.service';
import { io } from '../index';
import { getRouteParam } from '../utils/express';

export const getLeads = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, temperature, source, search, page = '1', limit = '20', assignedToId } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (temperature) where.temperature = temperature;
    if (source) where.source = source;
    if (assignedToId) where.assignedToId = assignedToId;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { company: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }
    const [leads, total] = await Promise.all([
      prisma.lead.findMany({
        where, skip, take: parseInt(limit as string),
        include: {
          assignedTo: { select: { id: true, name: true } },
          _count: { select: { conversations: true, quotations: true, followUps: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.lead.count({ where }),
    ]);
    res.json({ leads, total, page: parseInt(page as string), pages: Math.ceil(total / parseInt(limit as string)) });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch leads' });
  }
};

export const getLeadById = async (req: Request, res: Response): Promise<void> => {
  try {
    const leadId = getRouteParam(req.params.id);
    if (!leadId) { res.status(400).json({ error: 'Lead id is required' }); return; }

    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: {
        assignedTo: { select: { id: true, name: true, email: true } },
        customer: true,
        conversations: { include: { messages: { orderBy: { createdAt: 'desc' }, take: 5 } } },
        quotations: { orderBy: { createdAt: 'desc' } },
        followUps: { orderBy: { scheduledAt: 'asc' } },
        activities: { orderBy: { createdAt: 'desc' }, take: 20 },
      },
    });
    if (!lead) { res.status(404).json({ error: 'Lead not found' }); return; }
    res.json(lead);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch lead' });
  }
};

export const createLead = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, phone, company, designation, city, state, source, indiamartQuery, notes } = req.body;

    // Auto-qualify
    const qualification = await qualifyLead({ name, company, query: indiamartQuery });

    const lead = await prisma.lead.create({
      data: {
        name, email, phone, company, designation, city, state,
        source: source || 'MANUAL',
        indiamartQuery,
        notes,
        qualificationScore: qualification.score,
        temperature: qualification.temperature,
        urgency: qualification.qualificationData.urgency,
        purchaseIntent: qualification.qualificationData.purchaseIntent,
        assignedToId: 'system',
      },
    });

    // Activity log
    await prisma.activity.create({
      data: {
        type: 'LEAD_CREATED',
        description: `New lead created: ${name} ${company ? `from ${company}` : ''}`,
        leadId: lead.id,
        userId: 'system',
      },
    });

    // Auto-reply if email exists
    if (email && indiamartQuery) {
      try {
        const autoReply = await generateAutoReply(indiamartQuery, name);
        await sendWelcomeEmail({ to: email, customerName: name, autoReply });

        // Create initial conversation with AI reply
        const conversation = await prisma.conversation.create({ data: { leadId: lead.id } });
        await prisma.message.createMany({
          data: [
            { conversationId: conversation.id, sender: 'CUSTOMER', content: indiamartQuery },
            { conversationId: conversation.id, sender: 'AI', content: autoReply },
          ],
        });

        await prisma.lead.update({ where: { id: lead.id }, data: { status: 'CONTACTED', lastContactedAt: new Date() } });
      } catch { /* email/AI errors don't block lead creation */ }
    }

    io.emit('lead:new', { lead });
    res.status(201).json(lead);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create lead', details: String(error) });
  }
};

export const updateLead = async (req: Request, res: Response): Promise<void> => {
  try {
    const leadId = getRouteParam(req.params.id);
    if (!leadId) { res.status(400).json({ error: 'Lead id is required' }); return; }

    const oldLead = await prisma.lead.findUnique({ where: { id: leadId } });
    const lead = await prisma.lead.update({ where: { id: leadId }, data: req.body });

    if (oldLead?.status !== lead.status) {
      await prisma.activity.create({
        data: {
          type: 'LEAD_STATUS_CHANGED',
          description: `Status changed: ${oldLead?.status} → ${lead.status}`,
          leadId: lead.id, userId: 'system',
        },
      });
    }
    io.to(`lead-${lead.id}`).emit('lead:updated', { lead });
    res.json(lead);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update lead' });
  }
};

export const deleteLead = async (req: Request, res: Response): Promise<void> => {
  try {
    const leadId = getRouteParam(req.params.id);
    if (!leadId) { res.status(400).json({ error: 'Lead id is required' }); return; }

    await prisma.lead.delete({ where: { id: leadId } });
    res.json({ message: 'Lead deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete lead' });
  }
};

export const requalifyLead = async (req: Request, res: Response): Promise<void> => {
  try {
    const leadId = getRouteParam(req.params.id);
    if (!leadId) { res.status(400).json({ error: 'Lead id is required' }); return; }

    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: { conversations: { include: { messages: { take: 10, orderBy: { createdAt: 'desc' } } } } },
    });
    if (!lead) { res.status(404).json({ error: 'Lead not found' }); return; }

    const conversationSummary = lead.conversations
      .flatMap(c => c.messages)
      .map(m => `${m.sender}: ${m.content}`)
      .join('\n');

    const q = await qualifyLead({
      name: lead.name, company: lead.company || undefined, query: lead.indiamartQuery || undefined,
      budget: lead.budget || undefined, quantity: lead.quantity || undefined,
      urgency: lead.urgency || undefined, purchaseIntent: lead.purchaseIntent || undefined,
      conversationSummary,
    });

    const updated = await prisma.lead.update({
      where: { id: lead.id },
      data: { qualificationScore: q.score, temperature: q.temperature, ...q.qualificationData },
    });
    res.json({ ...updated, qualificationReason: q.reasoning });
  } catch (error) {
    res.status(500).json({ error: 'Re-qualification failed' });
  }
};

export const importLeadsFromCSV = async (req: Request, res: Response): Promise<void> => {
  try {
    const leads = req.body.leads as Array<Record<string, string>>;
    if (!Array.isArray(leads) || leads.length === 0) {
      res.status(400).json({ error: 'No leads provided' }); return;
    }
    const created = await Promise.all(
      leads.map(l => prisma.lead.create({
        data: {
          name: l.name || 'Unknown', phone: l.phone || '0000000000',
          email: l.email, company: l.company, city: l.city, state: l.state,
          source: 'CSV_IMPORT', indiamartQuery: l.query,
          assignedToId: 'system',
        },
      }))
    );
    res.status(201).json({ imported: created.length, leads: created });
  } catch (error) {
    res.status(500).json({ error: 'CSV import failed', details: String(error) });
  }
};

export const getKanbanLeads = async (req: Request, res: Response): Promise<void> => {
  try {
    const statuses = ['NEW','CONTACTED','REQUIREMENT_GATHERING','QUOTATION_SENT','FOLLOW_UP','NEGOTIATION','CONVERTED','LOST'];
    const result: Record<string, unknown[]> = {};
    await Promise.all(statuses.map(async (status) => {
      result[status] = await prisma.lead.findMany({
        where: { status: status as never },
        include: { assignedTo: { select: { name: true } }, _count: { select: { quotations: true } } },
        orderBy: [{ qualificationScore: 'desc' }, { createdAt: 'desc' }],
        take: 50,
      });
    }));
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch kanban data' });
  }
};
