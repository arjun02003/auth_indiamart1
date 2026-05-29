"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const quotations_controller_1 = require("../controllers/quotations.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
router.get('/', quotations_controller_1.getQuotations);
router.post('/', quotations_controller_1.createQuotation);
router.get('/:id', quotations_controller_1.getQuotationById);
router.get('/:id/pdf', quotations_controller_1.downloadQuotationPDF);
router.post('/:id/send-email', quotations_controller_1.sendQuotationByEmail);
router.put('/:id/status', quotations_controller_1.updateQuotationStatus);
exports.default = router;
//# sourceMappingURL=quotations.routes.js.map