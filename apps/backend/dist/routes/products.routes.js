"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const products_controller_1 = require("../controllers/products.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
router.get('/', products_controller_1.getProducts);
router.get('/categories', products_controller_1.getCategories);
router.get('/:id', products_controller_1.getProductById);
router.post('/', (0, auth_middleware_1.authorize)('ADMIN', 'SALES_MANAGER'), products_controller_1.createProduct);
router.put('/:id', (0, auth_middleware_1.authorize)('ADMIN', 'SALES_MANAGER'), products_controller_1.updateProduct);
router.delete('/:id', (0, auth_middleware_1.authorize)('ADMIN'), products_controller_1.deleteProduct);
exports.default = router;
//# sourceMappingURL=products.routes.js.map