"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateQuotationStatus = exports.sendQuotationByEmail = exports.downloadQuotationPDF = exports.createQuotation = exports.getQuotationById = exports.getQuotations = void 0;
const prisma_1 = require("../utils/prisma");
const express_1 = require("../utils/express");
const quotation_service_1 = require("../services/pdf/quotation.service");
const email_service_1 = require("../services/email/email.service");
const generateQuotationNumber = () => {
    const date = new Date();
    const yy = date.getFullYear().toString().slice(-2);
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `ASN/${yy}-${mm}/${rand}`;
};
const getQuotations = async (req, res) => {
    try {
        const { status, leadId, page = '1', limit = '20' } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const where = {};
        if (status)
            where.status = status;
        if (leadId)
            where.leadId = leadId;
        const [quotations, total] = await Promise.all([
            prisma_1.prisma.quotation.findMany({
                where, skip, take: parseInt(limit),
                include: {
                    lead: { select: { id: true, name: true, company: true, phone: true } },
                    customer: { select: { id: true, name: true, company: true } },
                    createdBy: { select: { id: true, name: true } },
                    items: true,
                },
                orderBy: { createdAt: 'desc' },
            }),
            prisma_1.prisma.quotation.count({ where }),
        ]);
        res.json({ quotations, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch quotations' });
    }
};
exports.getQuotations = getQuotations;
const getQuotationById = async (req, res) => {
    try {
        const quotationId = (0, express_1.getRouteParam)(req.params.id);
        if (!quotationId) {
            res.status(400).json({ error: 'Quotation id is required' });
            return;
        }
        const quotation = await prisma_1.prisma.quotation.findUnique({
            where: { id: quotationId },
            include: {
                lead: true, customer: true,
                createdBy: { select: { id: true, name: true } },
                items: { include: { product: true } },
            },
        });
        if (!quotation) {
            res.status(404).json({ error: 'Quotation not found' });
            return;
        }
        res.json(quotation);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch quotation' });
    }
};
exports.getQuotationById = getQuotationById;
const createQuotation = async (req, res) => {
    try {
        const { leadId, customerId, items, deliveryTerms, paymentTerms, warranty, notes, validDays = 15 } = req.body;
        if (!items || items.length === 0) {
            res.status(400).json({ error: 'At least one item required' });
            return;
        }
        // Calculate totals
        let subtotal = 0;
        let taxAmount = 0;
        const processedItems = items.map((item) => {
            const itemSubtotal = item.quantity * item.unitPrice;
            const itemTax = (itemSubtotal * (item.taxRate || 18)) / 100;
            const itemTotal = itemSubtotal + itemTax;
            subtotal += itemSubtotal;
            taxAmount += itemTax;
            return { ...item, taxAmount: itemTax, total: itemTotal, taxRate: item.taxRate || 18 };
        });
        const grandTotal = subtotal + taxAmount;
        const validUntil = new Date(Date.now() + validDays * 24 * 60 * 60 * 1000);
        const quotation = await prisma_1.prisma.quotation.create({
            data: {
                quotationNumber: generateQuotationNumber(),
                leadId, customerId,
                createdById: req.user.id,
                subtotal, taxAmount, grandTotal, discountAmount: 0,
                validUntil, deliveryTerms, paymentTerms, warranty, notes,
                items: { create: processedItems },
            },
            include: {
                lead: true, customer: true,
                items: { include: { product: true } },
                createdBy: { select: { id: true, name: true } },
            },
        });
        // Update lead status
        await prisma_1.prisma.lead.update({ where: { id: leadId }, data: { status: 'QUOTATION_SENT' } });
        await prisma_1.prisma.activity.create({
            data: {
                type: 'QUOTATION_CREATED',
                description: `Quotation ${quotation.quotationNumber} created for ₹${grandTotal.toFixed(0)}`,
                leadId, userId: req.user.id,
            },
        });
        res.status(201).json(quotation);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to create quotation', details: String(error) });
    }
};
exports.createQuotation = createQuotation;
const downloadQuotationPDF = async (req, res) => {
    try {
        const quotationId = (0, express_1.getRouteParam)(req.params.id);
        if (!quotationId) {
            res.status(400).json({ error: 'Quotation id is required' });
            return;
        }
        const quotation = await prisma_1.prisma.quotation.findUnique({
            where: { id: quotationId },
            include: { lead: true, customer: true, items: { include: { product: true } } },
        });
        if (!quotation) {
            res.status(404).json({ error: 'Quotation not found' });
            return;
        }
        const pdfBuffer = await (0, quotation_service_1.generateQuotationPDF)({
            quotationNumber: quotation.quotationNumber,
            date: quotation.createdAt,
            validUntil: quotation.validUntil,
            customer: {
                name: quotation.customer?.name || quotation.lead.name,
                company: quotation.customer?.company || quotation.lead.company || undefined,
                address: quotation.customer?.address || quotation.lead.state || undefined,
                city: quotation.customer?.city || quotation.lead.city || undefined,
                state: quotation.customer?.state || quotation.lead.state || undefined,
                phone: quotation.customer?.phone || quotation.lead.phone,
                email: quotation.customer?.email || quotation.lead.email || undefined,
                gst: quotation.customer?.gst || undefined,
            },
            items: quotation.items.map(i => ({
                name: i.name, description: i.description || undefined,
                quantity: i.quantity, unitPrice: i.unitPrice,
                taxRate: i.taxRate, taxAmount: i.taxAmount, total: i.total,
            })),
            subtotal: quotation.subtotal,
            taxAmount: quotation.taxAmount,
            discountAmount: quotation.discountAmount,
            grandTotal: quotation.grandTotal,
            deliveryTerms: quotation.deliveryTerms || undefined,
            paymentTerms: quotation.paymentTerms || undefined,
            warranty: quotation.warranty || undefined,
            notes: quotation.notes || undefined,
        });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="Quotation_${quotation.quotationNumber}.pdf"`);
        res.send(pdfBuffer);
    }
    catch (error) {
        res.status(500).json({ error: 'PDF generation failed', details: String(error) });
    }
};
exports.downloadQuotationPDF = downloadQuotationPDF;
const sendQuotationByEmail = async (req, res) => {
    try {
        const quotationId = (0, express_1.getRouteParam)(req.params.id);
        if (!quotationId) {
            res.status(400).json({ error: 'Quotation id is required' });
            return;
        }
        const quotation = await prisma_1.prisma.quotation.findUnique({
            where: { id: quotationId },
            include: { lead: true, customer: true, items: { include: { product: true } } },
        });
        if (!quotation) {
            res.status(404).json({ error: 'Quotation not found' });
            return;
        }
        const email = quotation.customer?.email || quotation.lead.email;
        if (!email) {
            res.status(400).json({ error: 'No email address for this lead/customer' });
            return;
        }
        const pdfBuffer = await (0, quotation_service_1.generateQuotationPDF)({
            quotationNumber: quotation.quotationNumber,
            date: quotation.createdAt,
            validUntil: quotation.validUntil,
            customer: {
                name: quotation.customer?.name || quotation.lead.name,
                company: quotation.customer?.company || quotation.lead.company || undefined,
                city: quotation.customer?.city || quotation.lead.city || undefined,
                state: quotation.customer?.state || quotation.lead.state || undefined,
                phone: quotation.customer?.phone || quotation.lead.phone,
                email,
                gst: quotation.customer?.gst || undefined,
            },
            items: quotation.items.map(i => ({
                name: i.name, description: i.description || undefined,
                quantity: i.quantity, unitPrice: i.unitPrice,
                taxRate: i.taxRate, taxAmount: i.taxAmount, total: i.total,
            })),
            subtotal: quotation.subtotal, taxAmount: quotation.taxAmount,
            discountAmount: quotation.discountAmount, grandTotal: quotation.grandTotal,
            deliveryTerms: quotation.deliveryTerms || undefined,
            paymentTerms: quotation.paymentTerms || undefined,
            warranty: quotation.warranty || undefined,
        });
        await (0, email_service_1.sendQuotationEmail)({
            to: email,
            customerName: quotation.customer?.name || quotation.lead.name,
            quotationNumber: quotation.quotationNumber,
            grandTotal: quotation.grandTotal,
            pdfBuffer,
        });
        await prisma_1.prisma.quotation.update({
            where: { id: quotation.id },
            data: { status: 'SENT', sentAt: new Date() },
        });
        await prisma_1.prisma.activity.create({
            data: {
                type: 'QUOTATION_SENT',
                description: `Quotation ${quotation.quotationNumber} emailed to ${email}`,
                leadId: quotation.leadId, userId: req.user.id,
            },
        });
        res.json({ message: 'Quotation sent successfully', to: email });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to send quotation', details: String(error) });
    }
};
exports.sendQuotationByEmail = sendQuotationByEmail;
const updateQuotationStatus = async (req, res) => {
    try {
        const quotationId = (0, express_1.getRouteParam)(req.params.id);
        if (!quotationId) {
            res.status(400).json({ error: 'Quotation id is required' });
            return;
        }
        const { status } = req.body;
        const quotation = await prisma_1.prisma.quotation.update({
            where: { id: quotationId },
            data: {
                status,
                ...(status === 'ACCEPTED' && { acceptedAt: new Date() }),
                ...(status === 'VIEWED' && { viewedAt: new Date() }),
            },
        });
        if (status === 'ACCEPTED') {
            await prisma_1.prisma.lead.update({ where: { id: quotation.leadId }, data: { status: 'CONVERTED', convertedAt: new Date() } });
        }
        res.json(quotation);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to update quotation status' });
    }
};
exports.updateQuotationStatus = updateQuotationStatus;
//# sourceMappingURL=quotations.controller.js.map