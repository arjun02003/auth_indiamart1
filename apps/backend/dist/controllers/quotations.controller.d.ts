import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
export declare const getQuotations: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getQuotationById: (req: AuthRequest, res: Response) => Promise<void>;
export declare const createQuotation: (req: AuthRequest, res: Response) => Promise<void>;
export declare const downloadQuotationPDF: (req: AuthRequest, res: Response) => Promise<void>;
export declare const sendQuotationByEmail: (req: AuthRequest, res: Response) => Promise<void>;
export declare const updateQuotationStatus: (req: AuthRequest, res: Response) => Promise<void>;
//# sourceMappingURL=quotations.controller.d.ts.map