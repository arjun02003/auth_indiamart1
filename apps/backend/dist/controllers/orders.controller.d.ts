import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
export declare const getOrders: (req: AuthRequest, res: Response) => Promise<void>;
export declare const createOrder: (req: AuthRequest, res: Response) => Promise<void>;
export declare const updateOrderStatus: (req: AuthRequest, res: Response) => Promise<void>;
//# sourceMappingURL=orders.controller.d.ts.map