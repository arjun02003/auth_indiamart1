"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const whatsapp_controller_1 = require("../controllers/whatsapp.controller");
const router = (0, express_1.Router)();
// Meta API will GET this endpoint to verify the webhook
router.get('/webhook', whatsapp_controller_1.verifyWebhook);
// Meta API will POST messages to this endpoint
router.post('/webhook', whatsapp_controller_1.handleIncomingMessage);
exports.default = router;
//# sourceMappingURL=whatsapp.routes.js.map