import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { createServer } from 'http';
import { Server } from 'socket.io';
import rateLimit from 'express-rate-limit';

import { prisma } from './utils/prisma';
import { logger } from './utils/logger';
import { followUpScheduler } from './services/scheduler/followup.service';

// Routes
import authRoutes from './routes/auth.routes';
import leadsRoutes from './routes/leads.routes';
import customersRoutes from './routes/customers.routes';
import conversationsRoutes from './routes/conversations.routes';
import quotationsRoutes from './routes/quotations.routes';
import productsRoutes from './routes/products.routes';
import ordersRoutes from './routes/orders.routes';
import analyticsRoutes from './routes/analytics.routes';
import notificationsRoutes from './routes/notifications.routes';
import dashboardRoutes from './routes/dashboard.routes';
import whatsappRoutes from './routes/whatsapp.routes';

const app = express();
const httpServer = createServer(app);

// ─── Socket.IO Setup ──────────────────────────────────────────────────────
export const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

io.on('connection', (socket) => {
  logger.info(`Socket connected: ${socket.id}`);

  socket.on('join-lead', (leadId: string) => {
    socket.join(`lead-${leadId}`);
  });

  socket.on('disconnect', () => {
    logger.info(`Socket disconnected: ${socket.id}`);
  });
});

// ─── Middleware ────────────────────────────────────────────────────────────
app.use(helmet());
app.use(compression());
app.use(morgan('combined', { stream: { write: (msg) => logger.http(msg.trim()) } }));
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: { error: 'Too many requests, please try again later.' },
});
app.use('/api', limiter);

// ─── Routes ───────────────────────────────────────────────────────────────
const API = '/api/v1';
app.use(`${API}/auth`, authRoutes);
app.use(`${API}/leads`, leadsRoutes);
app.use(`${API}/customers`, customersRoutes);
app.use(`${API}/conversations`, conversationsRoutes);
app.use(`${API}/quotations`, quotationsRoutes);
app.use(`${API}/products`, productsRoutes);
app.use(`${API}/orders`, ordersRoutes);
app.use(`${API}/analytics`, analyticsRoutes);
app.use(`${API}/notifications`, notificationsRoutes);
app.use(`${API}/dashboard`, dashboardRoutes);
app.use(`${API}/whatsapp`, whatsappRoutes);

// Health check
app.get('/health', (_, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), service: 'ASN Expo AI Sales Agent' });
});

// ─── Error Handler ────────────────────────────────────────────────────────
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

// ─── Start Server ─────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, async () => {
  logger.info(`🚀 ASN Expo AI Sales Agent Backend running on port ${PORT}`);
  logger.info(`📡 Socket.IO ready`);
  
  // Start follow-up scheduler
  followUpScheduler.start();
  logger.info('⏰ Follow-up scheduler started');
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down...');
  await prisma.$disconnect();
  process.exit(0);
});
