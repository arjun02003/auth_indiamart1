import { Router } from 'express';
import { getConversations, getConversationById, sendMessage, createConversation, agentReply } from '../controllers/conversations.controller';

const router = Router();
router.get('/', getConversations);
router.post('/', createConversation);
router.get('/:id', getConversationById);
router.post('/:conversationId/messages', sendMessage);
router.post('/:conversationId/agent-reply', agentReply);
export default router;
