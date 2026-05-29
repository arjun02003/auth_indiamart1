"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const orders_controller_1 = require("../controllers/orders.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
router.get('/', orders_controller_1.getOrders);
router.post('/', orders_controller_1.createOrder);
router.put('/:id/status', orders_controller_1.updateOrderStatus);
exports.default = router;
//# sourceMappingURL=orders.routes.js.map