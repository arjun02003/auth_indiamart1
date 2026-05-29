"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const customers_controller_1 = require("../controllers/customers.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
router.get('/', customers_controller_1.getCustomers);
router.get('/:id', customers_controller_1.getCustomerById);
router.post('/', customers_controller_1.createCustomer);
router.put('/:id', customers_controller_1.updateCustomer);
router.delete('/:id', (0, auth_middleware_1.authorize)('ADMIN'), customers_controller_1.deleteCustomer);
exports.default = router;
//# sourceMappingURL=customers.routes.js.map