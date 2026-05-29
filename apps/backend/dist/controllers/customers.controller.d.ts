import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
export declare const getCustomers: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getCustomerById: (req: AuthRequest, res: Response) => Promise<void>;
export declare const createCustomer: (req: AuthRequest, res: Response) => Promise<void>;
export declare const updateCustomer: (req: AuthRequest, res: Response) => Promise<void>;
export declare const deleteCustomer: (req: AuthRequest, res: Response) => Promise<void>;
//# sourceMappingURL=customers.controller.d.ts.map