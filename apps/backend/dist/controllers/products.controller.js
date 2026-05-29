"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCategories = exports.deleteProduct = exports.updateProduct = exports.createProduct = exports.getProductById = exports.getProducts = void 0;
const prisma_1 = require("../utils/prisma");
const express_1 = require("../utils/express");
const getProducts = async (req, res) => {
    try {
        const { category, search, page = '1', limit = '20' } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const where = { isActive: true };
        if (category)
            where.category = category;
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { brand: { contains: search, mode: 'insensitive' } },
                { sku: { contains: search, mode: 'insensitive' } },
            ];
        }
        const [products, total] = await Promise.all([
            prisma_1.prisma.product.findMany({ where, skip, take: parseInt(limit), orderBy: { category: 'asc' } }),
            prisma_1.prisma.product.count({ where }),
        ]);
        res.json({ products, total, pages: Math.ceil(total / parseInt(limit)) });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch products' });
    }
};
exports.getProducts = getProducts;
const getProductById = async (req, res) => {
    try {
        const productId = (0, express_1.getRouteParam)(req.params.id);
        if (!productId) {
            res.status(400).json({ error: 'Product id is required' });
            return;
        }
        const product = await prisma_1.prisma.product.findUnique({ where: { id: productId } });
        if (!product) {
            res.status(404).json({ error: 'Product not found' });
            return;
        }
        res.json(product);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch product' });
    }
};
exports.getProductById = getProductById;
const createProduct = async (req, res) => {
    try {
        const product = await prisma_1.prisma.product.create({ data: req.body });
        res.status(201).json(product);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to create product', details: String(error) });
    }
};
exports.createProduct = createProduct;
const updateProduct = async (req, res) => {
    try {
        const productId = (0, express_1.getRouteParam)(req.params.id);
        if (!productId) {
            res.status(400).json({ error: 'Product id is required' });
            return;
        }
        const product = await prisma_1.prisma.product.update({ where: { id: productId }, data: req.body });
        res.json(product);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to update product' });
    }
};
exports.updateProduct = updateProduct;
const deleteProduct = async (req, res) => {
    try {
        const productId = (0, express_1.getRouteParam)(req.params.id);
        if (!productId) {
            res.status(400).json({ error: 'Product id is required' });
            return;
        }
        await prisma_1.prisma.product.update({ where: { id: productId }, data: { isActive: false } });
        res.json({ message: 'Product deactivated' });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to delete product' });
    }
};
exports.deleteProduct = deleteProduct;
const getCategories = async (req, res) => {
    try {
        const categories = await prisma_1.prisma.product.groupBy({
            by: ['category'], where: { isActive: true }, _count: { id: true },
        });
        res.json(categories.map(c => ({ name: c.category, count: c._count.id })));
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch categories' });
    }
};
exports.getCategories = getCategories;
//# sourceMappingURL=products.controller.js.map