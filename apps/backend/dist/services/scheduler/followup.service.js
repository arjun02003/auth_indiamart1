"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.followUpScheduler = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const prisma_1 = require("../../utils/prisma");
const gemini_service_1 = require("../ai/gemini.service");
const email_service_1 = require("../email/email.service");
const logger_1 = require("../../utils/logger");
class FollowUpScheduler {
    constructor() {
        this.job = null;
    }
    start() {
        // Run every hour
        this.job = node_cron_1.default.schedule('0 * * * *', async () => {
            logger_1.logger.info('⏰ Running follow-up scheduler...');
            await this.processFollowUps();
        });
        logger_1.logger.info('✅ Follow-up scheduler initialized (runs hourly)');
    }
    stop() {
        if (this.job) {
            this.job.stop();
            logger_1.logger.info('Follow-up scheduler stopped');
        }
    }
    async processFollowUps() {
        try {
            const now = new Date();
            // Get all pending follow-ups that are due
            const dueFollowUps = await prisma_1.prisma.followUp.findMany({
                where: {
                    status: 'PENDING',
                    scheduledAt: { lte: now },
                },
                include: {
                    lead: {
                        select: { id: true, name: true, email: true, company: true, indiamartQuery: true, status: true },
                    },
                },
                take: 50, // Process max 50 at a time
            });
            logger_1.logger.info(`Found ${dueFollowUps.length} due follow-ups`);
            for (const followUp of dueFollowUps) {
                await this.sendFollowUp(followUp);
            }
            // Auto-create follow-ups for leads that haven't been followed up
            await this.createScheduledFollowUps();
            // Mark leads as inactive after 14 days
            await this.markInactiveLeads();
        }
        catch (error) {
            logger_1.logger.error('Follow-up scheduler error:', error);
        }
    }
    async sendFollowUp(followUp) {
        try {
            const { lead } = followUp;
            // Generate AI message if generic
            let message = followUp.message;
            if (!message || message.length < 20) {
                message = await (0, gemini_service_1.generateFollowUpMessage)({
                    name: lead.name,
                    company: lead.company || undefined,
                    lastQuery: lead.indiamartQuery || undefined,
                    followUpNumber: followUp.followUpNumber,
                    daysSinceContact: followUp.followUpNumber === 1 ? 1 : followUp.followUpNumber === 2 ? 3 : 7,
                });
            }
            // Send via email if available
            if (lead.email && followUp.channel === 'EMAIL') {
                await (0, email_service_1.sendFollowUpEmail)({
                    to: lead.email,
                    customerName: lead.name,
                    message,
                    followUpNumber: followUp.followUpNumber,
                });
            }
            // Mark as sent
            await prisma_1.prisma.followUp.update({
                where: { id: followUp.id },
                data: { status: 'SENT', sentAt: new Date(), message },
            });
            // Log activity
            await prisma_1.prisma.activity.create({
                data: {
                    type: 'FOLLOW_UP_SENT',
                    description: `Follow-up #${followUp.followUpNumber} sent to ${lead.name}`,
                    leadId: lead.id,
                },
            });
            // Update lead status to FOLLOW_UP if still NEW/CONTACTED
            if (['NEW', 'CONTACTED'].includes(lead.status)) {
                await prisma_1.prisma.lead.update({
                    where: { id: lead.id },
                    data: { status: 'FOLLOW_UP', lastContactedAt: new Date() },
                });
            }
            logger_1.logger.info(`✅ Follow-up #${followUp.followUpNumber} sent to ${lead.name}`);
        }
        catch (error) {
            logger_1.logger.error(`Failed to send follow-up ${followUp.id}:`, error);
            await prisma_1.prisma.followUp.update({
                where: { id: followUp.id },
                data: { status: 'FAILED', error: String(error) },
            });
        }
    }
    async createScheduledFollowUps() {
        try {
            const now = new Date();
            // Leads that need follow-up #1 (24 hours after creation, no follow-up yet)
            const leadsFor1stFollowUp = await prisma_1.prisma.lead.findMany({
                where: {
                    status: { in: ['NEW', 'CONTACTED'] },
                    createdAt: { lte: new Date(now.getTime() - 24 * 60 * 60 * 1000) },
                    followUps: { none: { followUpNumber: 1 } },
                },
                take: 20,
            });
            for (const lead of leadsFor1stFollowUp) {
                await prisma_1.prisma.followUp.create({
                    data: {
                        leadId: lead.id,
                        followUpNumber: 1,
                        channel: lead.email ? 'EMAIL' : 'CALL',
                        message: '',
                        scheduledAt: new Date(),
                    },
                });
            }
            // Follow-up #2 (3 days after first follow-up sent)
            const sentFirst = await prisma_1.prisma.followUp.findMany({
                where: {
                    followUpNumber: 1,
                    status: 'SENT',
                    sentAt: { lte: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000) },
                    lead: { followUps: { none: { followUpNumber: 2 } } },
                },
                select: { leadId: true },
                distinct: ['leadId'],
            });
            for (const fu of sentFirst) {
                await prisma_1.prisma.followUp.create({
                    data: {
                        leadId: fu.leadId,
                        followUpNumber: 2,
                        channel: 'EMAIL',
                        message: '',
                        scheduledAt: new Date(),
                    },
                });
            }
            // Follow-up #3 (7 days after second)
            const sentSecond = await prisma_1.prisma.followUp.findMany({
                where: {
                    followUpNumber: 2,
                    status: 'SENT',
                    sentAt: { lte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) },
                    lead: { followUps: { none: { followUpNumber: 3 } } },
                },
                select: { leadId: true },
                distinct: ['leadId'],
            });
            for (const fu of sentSecond) {
                await prisma_1.prisma.followUp.create({
                    data: {
                        leadId: fu.leadId,
                        followUpNumber: 3,
                        channel: 'EMAIL',
                        message: '',
                        scheduledAt: new Date(),
                    },
                });
            }
            if (leadsFor1stFollowUp.length > 0) {
                logger_1.logger.info(`Created ${leadsFor1stFollowUp.length} new follow-up #1 tasks`);
            }
        }
        catch (error) {
            logger_1.logger.error('Error creating scheduled follow-ups:', error);
        }
    }
    async markInactiveLeads() {
        const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
        try {
            const result = await prisma_1.prisma.lead.updateMany({
                where: {
                    status: 'FOLLOW_UP',
                    updatedAt: { lte: fourteenDaysAgo },
                    followUps: { some: { followUpNumber: 3, status: 'SENT' } },
                },
                data: { status: 'LOST' },
            });
            if (result.count > 0) {
                logger_1.logger.info(`Marked ${result.count} leads as LOST (inactive after 14 days)`);
            }
        }
        catch (error) {
            logger_1.logger.error('Error marking inactive leads:', error);
        }
    }
}
exports.followUpScheduler = new FollowUpScheduler();
//# sourceMappingURL=followup.service.js.map