"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = require("../utils/prisma");
const auth_middleware_1 = require("../middleware/auth.middleware");
const express_2 = require("../utils/express");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
router.get('/', async (req, res) => {
    const notifications = await prisma_1.prisma.notification.findMany({
        where: { OR: [{ targetUserId: req.user.id }, { targetUserId: null }] },
        orderBy: { createdAt: 'desc' }, take: 30,
    });
    res.json(notifications);
});
router.put('/:id/read', async (req, res) => {
    const notificationId = (0, express_2.getRouteParam)(req.params.id);
    if (!notificationId) {
        res.status(400).json({ error: 'Notification id is required' });
        return;
    }
    await prisma_1.prisma.notification.update({ where: { id: notificationId }, data: { isRead: true } });
    res.json({ message: 'Marked as read' });
});
router.put('/read-all', async (req, res) => {
    await prisma_1.prisma.notification.updateMany({
        where: { targetUserId: req.user.id, isRead: false },
        data: { isRead: true },
    });
    res.json({ message: 'All marked as read' });
});
exports.default = router;
//# sourceMappingURL=notifications.routes.js.map