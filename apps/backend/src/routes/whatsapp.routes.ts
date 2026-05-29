import { Router } from 'express';
import { verifyWebhook, handleIncomingMessage } from '../controllers/whatsapp.controller';

const router = Router();

// Meta API will GET this endpoint to verify the webhook
router.get('/webhook', verifyWebhook);

// Meta API will POST messages to this endpoint
router.post('/webhook', handleIncomingMessage);

export default router;
