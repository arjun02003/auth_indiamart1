import { Response } from 'express';
import { prisma } from '../utils/prisma';
import { AuthRequest } from '../middleware/auth.middleware';
import { getRouteParam } from '../utils/express';

export const getCustomers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { search, page = '1', limit = '20' } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { company: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }
    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where, skip, take: parseInt(limit as string),
        include: { _count: { select: { quotations: true, orders: true, leads: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.customer.count({ where }),
    ]);
    res.json({ customers, total, pages: Math.ceil(total / parseInt(limit as string)) });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
};

export const getCustomerById = async (req: Request, res: Response): Promise<void> => {
  try {
    const customerId = getRouteParam(req.params.id);
    if (!customerId) { res.status(400).json({ error: 'Customer id is required' }); return; }

    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        leads: { orderBy: { createdAt: 'desc' } },
        quotations: { orderBy: { createdAt: 'desc' }, take: 10 },
        orders: { orderBy: { createdAt: 'desc' }, take: 10 },
      },
    });
    if (!customer) { res.status(404).json({ error: 'Customer not found' }); return; }
    res.json(customer);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch customer' });
  }
};

export const createCustomer = async (req: Request, res: Response): Promise<void> => {
  try {
    const customer = await prisma.customer.create({ data: req.body });
    res.status(201).json(customer);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create customer', details: String(error) });
  }
};

export const updateCustomer = async (req: Request, res: Response): Promise<void> => {
  try {
    const customerId = getRouteParam(req.params.id);
    if (!customerId) { res.status(400).json({ error: 'Customer id is required' }); return; }

    const customer = await prisma.customer.update({ where: { id: customerId }, data: req.body });
    res.json(customer);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update customer' });
  }
};

export const deleteCustomer = async (req: Request, res: Response): Promise<void> => {
  try {
    const customerId = getRouteParam(req.params.id);
    if (!customerId) { res.status(400).json({ error: 'Customer id is required' }); return; }

    await prisma.customer.delete({ where: { id: customerId } });
    res.json({ message: 'Customer deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete customer' });
  }
};
