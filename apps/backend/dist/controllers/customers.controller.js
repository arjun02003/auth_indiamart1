"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCustomer = exports.updateCustomer = exports.createCustomer = exports.getCustomerById = exports.getCustomers = void 0;
const prisma_1 = require("../utils/prisma");
const express_1 = require("../utils/express");
const getCustomers = async (req, res) => {
    try {
        const { search, page = '1', limit = '20' } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const where = {};
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { company: { contains: search, mode: 'insensitive' } },
                { phone: { contains: search } },
                { email: { contains: search, mode: 'insensitive' } },
            ];
        }
        const [customers, total] = await Promise.all([
            prisma_1.prisma.customer.findMany({
                where, skip, take: parseInt(limit),
                include: { _count: { select: { quotations: true, orders: true, leads: true } } },
                orderBy: { createdAt: 'desc' },
            }),
            prisma_1.prisma.customer.count({ where }),
        ]);
        res.json({ customers, total, pages: Math.ceil(total / parseInt(limit)) });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch customers' });
    }
};
exports.getCustomers = getCustomers;
const getCustomerById = async (req, res) => {
    try {
        const customerId = (0, express_1.getRouteParam)(req.params.id);
        if (!customerId) {
            res.status(400).json({ error: 'Customer id is required' });
            return;
        }
        const customer = await prisma_1.prisma.customer.findUnique({
            where: { id: customerId },
            include: {
                leads: { orderBy: { createdAt: 'desc' } },
                quotations: { orderBy: { createdAt: 'desc' }, take: 10 },
                orders: { orderBy: { createdAt: 'desc' }, take: 10 },
            },
        });
        if (!customer) {
            res.status(404).json({ error: 'Customer not found' });
            return;
        }
        res.json(customer);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch customer' });
    }
};
exports.getCustomerById = getCustomerById;
const createCustomer = async (req, res) => {
    try {
        const customer = await prisma_1.prisma.customer.create({ data: req.body });
        res.status(201).json(customer);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to create customer', details: String(error) });
    }
};
exports.createCustomer = createCustomer;
const updateCustomer = async (req, res) => {
    try {
        const customerId = (0, express_1.getRouteParam)(req.params.id);
        if (!customerId) {
            res.status(400).json({ error: 'Customer id is required' });
            return;
        }
        const customer = await prisma_1.prisma.customer.update({ where: { id: customerId }, data: req.body });
        res.json(customer);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to update customer' });
    }
};
exports.updateCustomer = updateCustomer;
const deleteCustomer = async (req, res) => {
    try {
        const customerId = (0, express_1.getRouteParam)(req.params.id);
        if (!customerId) {
            res.status(400).json({ error: 'Customer id is required' });
            return;
        }
        await prisma_1.prisma.customer.delete({ where: { id: customerId } });
        res.json({ message: 'Customer deleted' });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to delete customer' });
    }
};
exports.deleteCustomer = deleteCustomer;
//# sourceMappingURL=customers.controller.js.map