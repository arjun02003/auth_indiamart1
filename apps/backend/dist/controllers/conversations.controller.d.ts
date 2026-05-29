import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
export declare const getConversations: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getConversationById: (req: AuthRequest, res: Response) => Promise<void>;
export declare const sendMessage: (req: AuthRequest, res: Response) => Promise<void>;
export declare const createConversation: (req: AuthRequest, res: Response) => Promise<void>;
export declare const agentReply: (req: AuthRequest, res: Response) => Promise<void>;
//# sourceMappingURL=conversations.controller.d.ts.map