# IndiaMART AI Sales Agent — ASN Expo

A production-grade, AI-powered CRM and sales automation platform built for IndiaMART lead management, utilizing Google Gemini 2.5 Pro for intelligent conversational AI, automated lead qualification, and dynamic quotation generation.

## Features Completed (Phase 1)
- **Real-time AI Chat**: Gemini 2.5 Pro simulates a Senior B2B Sales Executive (using your company details).
- **Lead Qualification Engine**: Automatically scores leads from 0-100 and classifies as Hot/Warm/Cold.
- **Kanban Leads Pipeline**: Drag-and-drop style dashboard to manage sales pipeline.
- **Professional PDF Quotations**: Generates highly detailed PDF quotations with GST calculations and embedded Terms & Conditions.
- **Automated Follow-ups**: Node-cron scheduler for 24hr / 3-day / 7-day follow-ups with AI-personalized email content.
- **Premium Dashboard**: Dark-mode SaaS UI with live KPI metrics and revenue charts.

## Prerequisites
- Node.js v20+
- PostgreSQL database (local or Neon/Supabase)

## Quick Start Guide

### 1. Configure Environment Variables
Copy `.env.example` to `.env` in the `apps/backend/` directory:
\`\`\`bash
cp apps/backend/.env.example apps/backend/.env
\`\`\`
Fill in the required keys:
- `DATABASE_URL` (PostgreSQL)
- `GEMINI_API_KEY` (Get from Google AI Studio)
- `SMTP_USER` & `SMTP_PASS` (For sending quotation/follow-up emails)

Create `.env.local` in `apps/frontend/`:
\`\`\`bash
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
\`\`\`

### 2. Install Dependencies
Run from the root directory:
\`\`\`bash
npm run install:all
\`\`\`

### 3. Setup Database
Initialize the Prisma schema and seed it with ASN Expo details, products, and sample leads:
\`\`\`bash
npm run db:push
npm run db:seed
\`\`\`

### 4. Run the Application
Start both the backend server and frontend Next.js app simultaneously:
\`\`\`bash
npm run dev
\`\`\`

- **Frontend URL**: [http://localhost:3000](http://localhost:3000)
- **Backend API URL**: [http://localhost:5000](http://localhost:5000)

### 5. Login
Use the seeded admin credentials to login to the dashboard:
- **Email**: `asnexpo94@gmail.com`
- **Password**: `Admin@123`

---

## What's Next (Phase 2)
In the next phase, we can implement:
1. WhatsApp Business API Webhook Integration
2. Docker deployment setup
3. RAG Knowledge Base with Vector Search

*Note: The IndiaMART specific API webhooks can be routed directly to `/api/v1/leads` once you have the CRM API access credentials.*
