# Deployment Guide — IndiaMART AI Sales Agent

This guide covers deploying the ASN Expo AI Sales Agent to production using **Railway** (for the Backend and PostgreSQL Database) and **Vercel** (for the Next.js Frontend).

## 1. Database Setup (Neon or Railway)

Since we are using `pgvector` for the RAG Knowledge Base, you have two great options:

**Option A: Neon (Serverless Postgres)**
1. Go to [Neon.tech](https://neon.tech) and create a free tier database.
2. Under "Extensions", enable `vector` (`CREATE EXTENSION vector;`).
3. Copy the Connection String.

**Option B: Railway PostgreSQL**
1. Go to [Railway.app](https://railway.app).
2. Click **New Project** -> **Provision PostgreSQL**.
3. *Note: Railway's default postgres image does not include pgvector by default. You may need to use the `ankane/pgvector` Docker image in Railway instead.*

## 2. Deploy Backend (Railway)

1. Connect your GitHub repository to Railway.
2. Railway will automatically detect the Dockerfile in the project if you set the Root Directory to `apps/backend` or use a custom Dockerfile path.
3. Go to the service **Settings** -> **Variables** and add:
   - `DATABASE_URL=your-neon-or-railway-postgres-url`
   - `GEMINI_API_KEY=your-gemini-key`
   - `JWT_SECRET=your-random-secure-string`
   - `SMTP_USER=asnexpo94@gmail.com`
   - `SMTP_PASS=your-gmail-app-password`
   - `WHATSAPP_API_TOKEN=your-meta-token`
   - `WHATSAPP_PHONE_ID=your-meta-phone-id`
   - `WHATSAPP_WEBHOOK_SECRET=your-webhook-secret`
4. Deploy the service.
5. Once deployed, Railway will give you a public URL (e.g., `https://backend-production-xyz.up.railway.app`). **Save this URL.**

## 3. Deploy Frontend (Vercel)

1. Go to [Vercel.com](https://vercel.com) and import your GitHub repository.
2. Set the **Framework Preset** to Next.js.
3. Set the **Root Directory** to `apps/frontend`.
4. Go to **Environment Variables** and add:
   - `NEXT_PUBLIC_API_URL=https://backend-production-xyz.up.railway.app/api/v1`
   - `NEXT_PUBLIC_SOCKET_URL=https://backend-production-xyz.up.railway.app`
5. Click **Deploy**.

## 4. Setting up WhatsApp Webhooks

Once your backend is live:
1. Go to the [Meta for Developers Dashboard](https://developers.facebook.com/).
2. Navigate to your WhatsApp App -> Configuration -> Webhooks.
3. Click **Edit** and enter:
   - **Callback URL**: `https://backend-production-xyz.up.railway.app/api/v1/whatsapp/webhook`
   - **Verify Token**: *The same string you used for `WHATSAPP_WEBHOOK_SECRET` in Railway.*
4. Subscribe to the `messages` webhook field.
5. Ensure your App is Live (requires Business Verification and an approved Phone Number).

## 5. Adding Documents to Knowledge Base (RAG)

Currently, the backend has the Prisma schema and the `/services/ai/rag.service.ts` logic ready.
To populate the database with technical PDFs/Manuals, you can create a simple script using the `addDocumentToKnowledgeBase` function, or add a File Upload UI in the Next.js frontend in the future.

---
**Done!** Your IndiaMART AI Sales Agent is now live and capable of communicating automatically on WhatsApp.
