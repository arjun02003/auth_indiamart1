import { Router } from 'express';
import { prisma } from '../utils/prisma';
import { Request, Response } from 'express';
import { getRouteParam } from '../utils/express';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  const notifications = await prisma.notification.findMany({
    where: { OR: [{ targetUserId: 'system' }, { targetUserId: null }] },
    orderBy: { createdAt: 'desc' }, take: 30,
  });
  res.json(notifications);
});

router.put('/:id/read', async (req: Request, res: Response) => {
  const notificationId = getRouteParam(req.params.id);
  if (!notificationId) { res.status(400).json({ error: 'Notification id is required' }); return; }

  await prisma.notification.update({ where: { id: notificationId }, data: { isRead: true } });
  res.json({ message: 'Marked as read' });
});

router.put('/read-all', async (req: Request, res: Response) => {
  await prisma.notification.updateMany({
    where: { targetUserId: 'system', isRead: false },
    data: { isRead: true },
  });
  res.json({ message: 'All marked as read' });
});

export default router;
