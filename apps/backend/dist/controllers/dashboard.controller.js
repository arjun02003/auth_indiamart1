"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDashboardStats = void 0;
const prisma_1 = require("../utils/prisma");
const getDashboardStats = async (req, res) => {
    try {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
        const [totalLeads, newLeads, hotLeads, warmLeads, convertedLeads, lostLeads, totalQuotations, acceptedQuotations, pendingFollowUps, totalRevenue, monthlyRevenue, lastMonthRevenue, recentActivities, recentLeads, topProducts,] = await Promise.all([
            prisma_1.prisma.lead.count(),
            prisma_1.prisma.lead.count({ where: { status: 'NEW' } }),
            prisma_1.prisma.lead.count({ where: { temperature: 'HOT' } }),
            prisma_1.prisma.lead.count({ where: { temperature: 'WARM' } }),
            prisma_1.prisma.lead.count({ where: { status: 'CONVERTED' } }),
            prisma_1.prisma.lead.count({ where: { status: 'LOST' } }),
            prisma_1.prisma.quotation.count(),
            prisma_1.prisma.quotation.count({ where: { status: 'ACCEPTED' } }),
            prisma_1.prisma.followUp.count({ where: { status: 'PENDING' } }),
            prisma_1.prisma.quotation.aggregate({ where: { status: 'ACCEPTED' }, _sum: { grandTotal: true } }),
            prisma_1.prisma.quotation.aggregate({ where: { status: 'ACCEPTED', createdAt: { gte: startOfMonth } }, _sum: { grandTotal: true } }),
            prisma_1.prisma.quotation.aggregate({ where: { status: 'ACCEPTED', createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } }, _sum: { grandTotal: true } }),
            prisma_1.prisma.activity.findMany({ orderBy: { createdAt: 'desc' }, take: 10, include: { lead: { select: { name: true, company: true } }, user: { select: { name: true } } } }),
            prisma_1.prisma.lead.findMany({ orderBy: { createdAt: 'desc' }, take: 5, include: { assignedTo: { select: { name: true } } } }),
            prisma_1.prisma.quotationItem.groupBy({ by: ['name'], _sum: { total: true }, orderBy: { _sum: { total: 'desc' } }, take: 5 }),
        ]);
        // Monthly lead trend (last 6 months)
        const months = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
            const count = await prisma_1.prisma.lead.count({ where: { createdAt: { gte: d, lte: end } } });
            months.push({ month: d.toLocaleString('en-IN', { month: 'short' }), leads: count });
        }
        const thisMonthRev = monthlyRevenue._sum.grandTotal || 0;
        const lastMonthRev = lastMonthRevenue._sum.grandTotal || 0;
        const revenueGrowth = lastMonthRev > 0 ? (((thisMonthRev - lastMonthRev) / lastMonthRev) * 100).toFixed(1) : '0';
        const conversionRate = totalLeads > 0 ? ((convertedLeads / totalLeads) * 100).toFixed(1) : '0';
        res.json({
            overview: {
                totalLeads, newLeads, hotLeads, warmLeads,
                convertedLeads, lostLeads,
                totalQuotations, acceptedQuotations,
                pendingFollowUps,
                conversionRate: parseFloat(conversionRate),
            },
            revenue: {
                total: totalRevenue._sum.grandTotal || 0,
                thisMonth: thisMonthRev,
                lastMonth: lastMonthRev,
                growth: parseFloat(revenueGrowth),
            },
            charts: { monthlyLeads: months, topProducts },
            recentActivities,
            recentLeads,
        });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch dashboard stats' });
    }
};
exports.getDashboardStats = getDashboardStats;
//# sourceMappingURL=dashboard.controller.js.map