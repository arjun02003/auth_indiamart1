"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const conversations_controller_1 = require("../controllers/conversations.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
router.get('/', conversations_controller_1.getConversations);
router.post('/', conversations_controller_1.createConversation);
router.get('/:id', conversations_controller_1.getConversationById);
router.post('/:conversationId/messages', conversations_controller_1.sendMessage);
router.post('/:conversationId/agent-reply', conversations_controller_1.agentReply);
exports.default = router;
//# sourceMappingURL=conversations.routes.js.map