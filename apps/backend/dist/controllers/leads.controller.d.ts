import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
export declare const getLeads: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getLeadById: (req: AuthRequest, res: Response) => Promise<void>;
export declare const createLead: (req: AuthRequest, res: Response) => Promise<void>;
export declare const updateLead: (req: AuthRequest, res: Response) => Promise<void>;
export declare const deleteLead: (req: AuthRequest, res: Response) => Promise<void>;
export declare const requalifyLead: (req: AuthRequest, res: Response) => Promise<void>;
export declare const importLeadsFromCSV: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getKanbanLeads: (req: AuthRequest, res: Response) => Promise<void>;
//# sourceMappingURL=leads.controller.d.ts.map