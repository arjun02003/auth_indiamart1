"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const morgan_1 = __importDefault(require("morgan"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const prisma_1 = require("./utils/prisma");
const logger_1 = require("./utils/logger");
const followup_service_1 = require("./services/scheduler/followup.service");
// Routes
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const leads_routes_1 = __importDefault(require("./routes/leads.routes"));
const customers_routes_1 = __importDefault(require("./routes/customers.routes"));
const conversations_routes_1 = __importDefault(require("./routes/conversations.routes"));
const quotations_routes_1 = __importDefault(require("./routes/quotations.routes"));
const products_routes_1 = __importDefault(require("./routes/products.routes"));
const orders_routes_1 = __importDefault(require("./routes/orders.routes"));
const analytics_routes_1 = __importDefault(require("./routes/analytics.routes"));
const notifications_routes_1 = __importDefault(require("./routes/notifications.routes"));
const dashboard_routes_1 = __importDefault(require("./routes/dashboard.routes"));
const whatsapp_routes_1 = __importDefault(require("./routes/whatsapp.routes"));
const app = (0, express_1.default)();
const httpServer = (0, http_1.createServer)(app);
// ─── Socket.IO Setup ──────────────────────────────────────────────────────
exports.io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true,
    },
});
exports.io.on('connection', (socket) => {
    logger_1.logger.info(`Socket connected: ${socket.id}`);
    socket.on('join-lead', (leadId) => {
        socket.join(`lead-${leadId}`);
    });
    socket.on('disconnect', () => {
        logger_1.logger.info(`Socket disconnected: ${socket.id}`);
    });
});
// ─── Middleware ────────────────────────────────────────────────────────────
app.use((0, helmet_1.default)());
app.use((0, compression_1.default)());
app.use((0, morgan_1.default)('combined', { stream: { write: (msg) => logger_1.logger.http(msg.trim()) } }));
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
}));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
// Rate limiting
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 300,
    message: { error: 'Too many requests, please try again later.' },
});
app.use('/api', limiter);
// ─── Routes ───────────────────────────────────────────────────────────────
const API = '/api/v1';
app.use(`${API}/auth`, auth_routes_1.default);
app.use(`${API}/leads`, leads_routes_1.default);
app.use(`${API}/customers`, customers_routes_1.default);
app.use(`${API}/conversations`, conversations_routes_1.default);
app.use(`${API}/quotations`, quotations_routes_1.default);
app.use(`${API}/products`, products_routes_1.default);
app.use(`${API}/orders`, orders_routes_1.default);
app.use(`${API}/analytics`, analytics_routes_1.default);
app.use(`${API}/notifications`, notifications_routes_1.default);
app.use(`${API}/dashboard`, dashboard_routes_1.default);
app.use(`${API}/whatsapp`, whatsapp_routes_1.default);
// Health check
app.get('/health', (_, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString(), service: 'ASN Expo AI Sales Agent' });
});
// ─── Error Handler ────────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
    logger_1.logger.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error', message: err.message });
});
// ─── Start Server ─────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, async () => {
    logger_1.logger.info(`🚀 ASN Expo AI Sales Agent Backend running on port ${PORT}`);
    logger_1.logger.info(`📡 Socket.IO ready`);
    // Start follow-up scheduler
    followup_service_1.followUpScheduler.start();
    logger_1.logger.info('⏰ Follow-up scheduler started');
});
// Graceful shutdown
process.on('SIGTERM', async () => {
    logger_1.logger.info('SIGTERM received, shutting down...');
    await prisma_1.prisma.$disconnect();
    process.exit(0);
});
//# sourceMappingURL=index.js.map