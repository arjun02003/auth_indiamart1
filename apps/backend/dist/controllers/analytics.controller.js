"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAnalytics = void 0;
const prisma_1 = require("../utils/prisma");
const getAnalytics = async (req, res) => {
    try {
        const { period = '30' } = req.query;
        const days = parseInt(period);
        const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
        const [leadsByStatus, leadsBySource, leadsByTemperature, quotationsByStatus, revenueByMonth, conversionFunnel, topProducts,] = await Promise.all([
            prisma_1.prisma.lead.groupBy({ by: ['status'], _count: { id: true } }),
            prisma_1.prisma.lead.groupBy({ by: ['source'], _count: { id: true } }),
            prisma_1.prisma.lead.groupBy({ by: ['temperature'], _count: { id: true } }),
            prisma_1.prisma.quotation.groupBy({ by: ['status'], _count: { id: true }, _sum: { grandTotal: true } }),
            // Monthly revenue for last 6 months
            Promise.all(Array.from({ length: 6 }, async (_, i) => {
                const d = new Date();
                d.setMonth(d.getMonth() - (5 - i));
                const start = new Date(d.getFullYear(), d.getMonth(), 1);
                const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
                const agg = await prisma_1.prisma.quotation.aggregate({
                    where: { status: 'ACCEPTED', createdAt: { gte: start, lte: end } },
                    _sum: { grandTotal: true }, _count: { id: true },
                });
                return {
                    month: start.toLocaleString('en-IN', { month: 'short', year: '2-digit' }),
                    revenue: agg._sum.grandTotal || 0,
                    quotations: agg._count.id,
                };
            })),
            // Conversion funnel
            Promise.all(['NEW', 'CONTACTED', 'REQUIREMENT_GATHERING', 'QUOTATION_SENT', 'NEGOTIATION', 'CONVERTED'].map(async (status) => ({
                stage: status,
                count: await prisma_1.prisma.lead.count({ where: { status: status } }),
            }))),
            prisma_1.prisma.quotationItem.groupBy({
                by: ['name'], _sum: { total: true, quantity: true }, orderBy: { _sum: { total: 'desc' } }, take: 10,
            }),
        ]);
        res.json({
            leadsByStatus: leadsByStatus.map(l => ({ status: l.status, count: l._count.id })),
            leadsBySource: leadsBySource.map(l => ({ source: l.source, count: l._count.id })),
            leadsByTemperature: leadsByTemperature.map(l => ({ temperature: l.temperature, count: l._count.id })),
            quotationsByStatus: quotationsByStatus.map(q => ({ status: q.status, count: q._count.id, revenue: q._sum.grandTotal || 0 })),
            revenueByMonth,
            conversionFunnel,
            topProducts: topProducts.map(p => ({ name: p.name, revenue: p._sum.total || 0, quantity: p._sum.quantity || 0 })),
        });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch analytics' });
    }
};
exports.getAnalytics = getAnalytics;
//# sourceMappingURL=analytics.controller.js.map