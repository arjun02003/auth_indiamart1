"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateOrderStatus = exports.createOrder = exports.getOrders = void 0;
const prisma_1 = require("../utils/prisma");
const express_1 = require("../utils/express");
const getOrders = async (req, res) => {
    try {
        const { status, page = '1', limit = '20' } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const where = {};
        if (status)
            where.status = status;
        const [orders, total] = await Promise.all([
            prisma_1.prisma.order.findMany({
                where, skip, take: parseInt(limit),
                include: { lead: { select: { name: true, company: true, phone: true } }, customer: { select: { name: true, company: true } } },
                orderBy: { createdAt: 'desc' },
            }),
            prisma_1.prisma.order.count({ where }),
        ]);
        res.json({ orders, total, pages: Math.ceil(total / parseInt(limit)) });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
};
exports.getOrders = getOrders;
const createOrder = async (req, res) => {
    try {
        const { leadId, customerId, totalAmount, notes, deliveryAddress, expectedDelivery } = req.body;
        const date = new Date();
        const orderNumber = `ORD/${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${Math.floor(1000 + Math.random() * 9000)}`;
        const order = await prisma_1.prisma.order.create({
            data: { orderNumber, leadId, customerId, totalAmount, notes, deliveryAddress, expectedDelivery: expectedDelivery ? new Date(expectedDelivery) : undefined },
            include: { lead: { select: { name: true, company: true } } },
        });
        await prisma_1.prisma.lead.update({ where: { id: leadId }, data: { status: 'CONVERTED', convertedAt: new Date() } });
        await prisma_1.prisma.activity.create({
            data: { type: 'ORDER_CREATED', description: `Order ${orderNumber} created for ₹${totalAmount}`, leadId, userId: req.user.id },
        });
        res.status(201).json(order);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to create order', details: String(error) });
    }
};
exports.createOrder = createOrder;
const updateOrderStatus = async (req, res) => {
    try {
        const orderId = (0, express_1.getRouteParam)(req.params.id);
        if (!orderId) {
            res.status(400).json({ error: 'Order id is required' });
            return;
        }
        const order = await prisma_1.prisma.order.update({ where: { id: orderId }, data: { status: req.body.status } });
        res.json(order);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to update order' });
    }
};
exports.updateOrderStatus = updateOrderStatus;
//# sourceMappingURL=orders.controller.js.map