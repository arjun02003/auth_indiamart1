import { Response } from 'express';
import { prisma } from '../utils/prisma';
import { AuthRequest } from '../middleware/auth.middleware';
import { getRouteParam } from '../utils/express';

export const getOrders = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, page = '1', limit = '20' } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where, skip, take: parseInt(limit as string),
        include: { lead: { select: { name: true, company: true, phone: true } }, customer: { select: { name: true, company: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.order.count({ where }),
    ]);
    res.json({ orders, total, pages: Math.ceil(total / parseInt(limit as string)) });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
};

export const createOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const { leadId, customerId, totalAmount, notes, deliveryAddress, expectedDelivery } = req.body;
    const date = new Date();
    const orderNumber = `ORD/${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${Math.floor(1000 + Math.random() * 9000)}`;

    const order = await prisma.order.create({
      data: { orderNumber, leadId, customerId, totalAmount, notes, deliveryAddress, expectedDelivery: expectedDelivery ? new Date(expectedDelivery) : undefined },
      include: { lead: { select: { name: true, company: true } } },
    });

    await prisma.lead.update({ where: { id: leadId }, data: { status: 'CONVERTED', convertedAt: new Date() } });
    await prisma.activity.create({
      data: { type: 'ORDER_CREATED', description: `Order ${orderNumber} created for ₹${totalAmount}`, leadId, userId: 'system' },
    });

    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create order', details: String(error) });
  }
};

export const updateOrderStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const orderId = getRouteParam(req.params.id);
    if (!orderId) { res.status(400).json({ error: 'Order id is required' }); return; }

    const order = await prisma.order.update({ where: { id: orderId }, data: { status: req.body.status } });
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update order' });
  }
};
