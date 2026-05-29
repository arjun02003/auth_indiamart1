"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const leads_controller_1 = require("../controllers/leads.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
router.get('/', leads_controller_1.getLeads);
router.get('/kanban', leads_controller_1.getKanbanLeads);
router.get('/:id', leads_controller_1.getLeadById);
router.post('/', leads_controller_1.createLead);
router.post('/import/csv', leads_controller_1.importLeadsFromCSV);
router.put('/:id', leads_controller_1.updateLead);
router.post('/:id/requalify', leads_controller_1.requalifyLead);
router.delete('/:id', (0, auth_middleware_1.authorize)('ADMIN', 'SALES_MANAGER'), leads_controller_1.deleteLead);
exports.default = router;
//# sourceMappingURL=leads.routes.js.map