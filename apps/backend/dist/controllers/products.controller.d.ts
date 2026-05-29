import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
export declare const getProducts: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getProductById: (req: AuthRequest, res: Response) => Promise<void>;
export declare const createProduct: (req: AuthRequest, res: Response) => Promise<void>;
export declare const updateProduct: (req: AuthRequest, res: Response) => Promise<void>;
export declare const deleteProduct: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getCategories: (req: AuthRequest, res: Response) => Promise<void>;
//# sourceMappingURL=products.controller.d.ts.map