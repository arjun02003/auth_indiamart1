"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
router.post('/login', auth_controller_1.login);
router.get('/me', auth_middleware_1.authenticate, auth_controller_1.getMe);
router.put('/profile', auth_middleware_1.authenticate, auth_controller_1.updateProfile);
router.put('/change-password', auth_middleware_1.authenticate, auth_controller_1.changePassword);
router.get('/users', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)('ADMIN'), auth_controller_1.listUsers);
router.post('/users', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)('ADMIN'), auth_controller_1.createUser);
exports.default = router;
//# sourceMappingURL=auth.routes.js.map