import { Router } from 'express';
import { getLeads, getLeadById, createLead, updateLead, deleteLead, requalifyLead, importLeadsFromCSV, getKanbanLeads } from '../controllers/leads.controller';

const router = Router();
router.get('/', getLeads);
router.get('/kanban', getKanbanLeads);
router.get('/:id', getLeadById);
router.post('/', createLead);
router.post('/import/csv', importLeadsFromCSV);
router.put('/:id', updateLead);
router.post('/:id/requalify', requalifyLead);
router.delete('/:id', deleteLead);
export default router;
