import { Response } from 'express';
import { prisma } from '../utils/prisma';
import { AuthRequest } from '../middleware/auth.middleware';
import { getRouteParam } from '../utils/express';

export const getProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { category, search, page = '1', limit = '20' } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const where: Record<string, unknown> = { isActive: true };
    if (category) where.category = category;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { brand: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
      ];
    }
    const [products, total] = await Promise.all([
      prisma.product.findMany({ where, skip, take: parseInt(limit as string), orderBy: { category: 'asc' } }),
      prisma.product.count({ where }),
    ]);
    res.json({ products, total, pages: Math.ceil(total / parseInt(limit as string)) });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
};

export const getProductById = async (req: Request, res: Response): Promise<void> => {
  try {
    const productId = getRouteParam(req.params.id);
    if (!productId) { res.status(400).json({ error: 'Product id is required' }); return; }

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) { res.status(404).json({ error: 'Product not found' }); return; }
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch product' });
  }
};

export const createProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const product = await prisma.product.create({ data: req.body });
    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create product', details: String(error) });
  }
};

export const updateProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const productId = getRouteParam(req.params.id);
    if (!productId) { res.status(400).json({ error: 'Product id is required' }); return; }

    const product = await prisma.product.update({ where: { id: productId }, data: req.body });
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update product' });
  }
};

export const deleteProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const productId = getRouteParam(req.params.id);
    if (!productId) { res.status(400).json({ error: 'Product id is required' }); return; }

    await prisma.product.update({ where: { id: productId }, data: { isActive: false } });
    res.json({ message: 'Product deactivated' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete product' });
  }
};

export const getCategories = async (req: Request, res: Response): Promise<void> => {
  try {
    const categories = await prisma.product.groupBy({
      by: ['category'], where: { isActive: true }, _count: { id: true },
    });
    res.json(categories.map(c => ({ name: c.category, count: c._count.id })));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
};
