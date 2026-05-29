import { Router } from 'express';
import { getQuotations, getQuotationById, createQuotation, downloadQuotationPDF, sendQuotationByEmail, updateQuotationStatus } from '../controllers/quotations.controller';

const router = Router();
router.get('/', getQuotations);
router.post('/', createQuotation);
router.get('/:id', getQuotationById);
router.get('/:id/pdf', downloadQuotationPDF);
router.post('/:id/send-email', sendQuotationByEmail);
router.put('/:id/status', updateQuotationStatus);
export default router;
