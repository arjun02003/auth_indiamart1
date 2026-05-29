"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getKanbanLeads = exports.importLeadsFromCSV = exports.requalifyLead = exports.deleteLead = exports.updateLead = exports.createLead = exports.getLeadById = exports.getLeads = void 0;
const prisma_1 = require("../utils/prisma");
const gemini_service_1 = require("../services/ai/gemini.service");
const email_service_1 = require("../services/email/email.service");
const index_1 = require("../index");
const express_1 = require("../utils/express");
const getLeads = async (req, res) => {
    try {
        const { status, temperature, source, search, page = '1', limit = '20', assignedToId } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const where = {};
        if (status)
            where.status = status;
        if (temperature)
            where.temperature = temperature;
        if (source)
            where.source = source;
        if (assignedToId)
            where.assignedToId = assignedToId;
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { company: { contains: search, mode: 'insensitive' } },
                { phone: { contains: search } },
                { email: { contains: search, mode: 'insensitive' } },
            ];
        }
        const [leads, total] = await Promise.all([
            prisma_1.prisma.lead.findMany({
                where, skip, take: parseInt(limit),
                include: {
                    assignedTo: { select: { id: true, name: true } },
                    _count: { select: { conversations: true, quotations: true, followUps: true } },
                },
                orderBy: { createdAt: 'desc' },
            }),
            prisma_1.prisma.lead.count({ where }),
        ]);
        res.json({ leads, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch leads' });
    }
};
exports.getLeads = getLeads;
const getLeadById = async (req, res) => {
    try {
        const leadId = (0, express_1.getRouteParam)(req.params.id);
        if (!leadId) {
            res.status(400).json({ error: 'Lead id is required' });
            return;
        }
        const lead = await prisma_1.prisma.lead.findUnique({
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
        if (!lead) {
            res.status(404).json({ error: 'Lead not found' });
            return;
        }
        res.json(lead);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch lead' });
    }
};
exports.getLeadById = getLeadById;
const createLead = async (req, res) => {
    try {
        const { name, email, phone, company, designation, city, state, source, indiamartQuery, notes } = req.body;
        // Auto-qualify
        const qualification = await (0, gemini_service_1.qualifyLead)({ name, company, query: indiamartQuery });
        const lead = await prisma_1.prisma.lead.create({
            data: {
                name, email, phone, company, designation, city, state,
                source: source || 'MANUAL',
                indiamartQuery,
                notes,
                qualificationScore: qualification.score,
                temperature: qualification.temperature,
                urgency: qualification.qualificationData.urgency,
                purchaseIntent: qualification.qualificationData.purchaseIntent,
                assignedToId: req.user.id,
            },
        });
        // Activity log
        await prisma_1.prisma.activity.create({
            data: {
                type: 'LEAD_CREATED',
                description: `New lead created: ${name} ${company ? `from ${company}` : ''}`,
                leadId: lead.id,
                userId: req.user.id,
            },
        });
        // Auto-reply if email exists
        if (email && indiamartQuery) {
            try {
                const autoReply = await (0, gemini_service_1.generateAutoReply)(indiamartQuery, name);
                await (0, email_service_1.sendWelcomeEmail)({ to: email, customerName: name, autoReply });
                // Create initial conversation with AI reply
                const conversation = await prisma_1.prisma.conversation.create({ data: { leadId: lead.id } });
                await prisma_1.prisma.message.createMany({
                    data: [
                        { conversationId: conversation.id, sender: 'CUSTOMER', content: indiamartQuery },
                        { conversationId: conversation.id, sender: 'AI', content: autoReply },
                    ],
                });
                await prisma_1.prisma.lead.update({ where: { id: lead.id }, data: { status: 'CONTACTED', lastContactedAt: new Date() } });
            }
            catch { /* email/AI errors don't block lead creation */ }
        }
        index_1.io.emit('lead:new', { lead });
        res.status(201).json(lead);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to create lead', details: String(error) });
    }
};
exports.createLead = createLead;
const updateLead = async (req, res) => {
    try {
        const leadId = (0, express_1.getRouteParam)(req.params.id);
        if (!leadId) {
            res.status(400).json({ error: 'Lead id is required' });
            return;
        }
        const oldLead = await prisma_1.prisma.lead.findUnique({ where: { id: leadId } });
        const lead = await prisma_1.prisma.lead.update({ where: { id: leadId }, data: req.body });
        if (oldLead?.status !== lead.status) {
            await prisma_1.prisma.activity.create({
                data: {
                    type: 'LEAD_STATUS_CHANGED',
                    description: `Status changed: ${oldLead?.status} → ${lead.status}`,
                    leadId: lead.id, userId: req.user.id,
                },
            });
        }
        index_1.io.to(`lead-${lead.id}`).emit('lead:updated', { lead });
        res.json(lead);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to update lead' });
    }
};
exports.updateLead = updateLead;
const deleteLead = async (req, res) => {
    try {
        const leadId = (0, express_1.getRouteParam)(req.params.id);
        if (!leadId) {
            res.status(400).json({ error: 'Lead id is required' });
            return;
        }
        await prisma_1.prisma.lead.delete({ where: { id: leadId } });
        res.json({ message: 'Lead deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to delete lead' });
    }
};
exports.deleteLead = deleteLead;
const requalifyLead = async (req, res) => {
    try {
        const leadId = (0, express_1.getRouteParam)(req.params.id);
        if (!leadId) {
            res.status(400).json({ error: 'Lead id is required' });
            return;
        }
        const lead = await prisma_1.prisma.lead.findUnique({
            where: { id: leadId },
            include: { conversations: { include: { messages: { take: 10, orderBy: { createdAt: 'desc' } } } } },
        });
        if (!lead) {
            res.status(404).json({ error: 'Lead not found' });
            return;
        }
        const conversationSummary = lead.conversations
            .flatMap(c => c.messages)
            .map(m => `${m.sender}: ${m.content}`)
            .join('\n');
        const q = await (0, gemini_service_1.qualifyLead)({
            name: lead.name, company: lead.company || undefined, query: lead.indiamartQuery || undefined,
            budget: lead.budget || undefined, quantity: lead.quantity || undefined,
            urgency: lead.urgency || undefined, purchaseIntent: lead.purchaseIntent || undefined,
            conversationSummary,
        });
        const updated = await prisma_1.prisma.lead.update({
            where: { id: lead.id },
            data: { qualificationScore: q.score, temperature: q.temperature, ...q.qualificationData },
        });
        res.json({ ...updated, qualificationReason: q.reasoning });
    }
    catch (error) {
        res.status(500).json({ error: 'Re-qualification failed' });
    }
};
exports.requalifyLead = requalifyLead;
const importLeadsFromCSV = async (req, res) => {
    try {
        const leads = req.body.leads;
        if (!Array.isArray(leads) || leads.length === 0) {
            res.status(400).json({ error: 'No leads provided' });
            return;
        }
        const created = await Promise.all(leads.map(l => prisma_1.prisma.lead.create({
            data: {
                name: l.name || 'Unknown', phone: l.phone || '0000000000',
                email: l.email, company: l.company, city: l.city, state: l.state,
                source: 'CSV_IMPORT', indiamartQuery: l.query,
                assignedToId: req.user.id,
            },
        })));
        res.status(201).json({ imported: created.length, leads: created });
    }
    catch (error) {
        res.status(500).json({ error: 'CSV import failed', details: String(error) });
    }
};
exports.importLeadsFromCSV = importLeadsFromCSV;
const getKanbanLeads = async (req, res) => {
    try {
        const statuses = ['NEW', 'CONTACTED', 'REQUIREMENT_GATHERING', 'QUOTATION_SENT', 'FOLLOW_UP', 'NEGOTIATION', 'CONVERTED', 'LOST'];
        const result = {};
        await Promise.all(statuses.map(async (status) => {
            result[status] = await prisma_1.prisma.lead.findMany({
                where: { status: status },
                include: { assignedTo: { select: { name: true } }, _count: { select: { quotations: true } } },
                orderBy: [{ qualificationScore: 'desc' }, { createdAt: 'desc' }],
                take: 50,
            });
        }));
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch kanban data' });
    }
};
exports.getKanbanLeads = getKanbanLeads;
//# sourceMappingURL=leads.controller.js.map