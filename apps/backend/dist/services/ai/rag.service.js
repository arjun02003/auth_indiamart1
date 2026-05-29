"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateEmbedding = generateEmbedding;
exports.addDocumentToKnowledgeBase = addDocumentToKnowledgeBase;
exports.searchKnowledgeBase = searchKnowledgeBase;
const generative_ai_1 = require("@google/generative-ai");
const prisma_1 = require("../../utils/prisma");
const logger_1 = require("../../utils/logger");
const genAI = new generative_ai_1.GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
/**
 * Generate an embedding for a given text using text-embedding-004
 */
async function generateEmbedding(text) {
    try {
        const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });
        const result = await model.embedContent(text);
        return result.embedding.values;
    }
    catch (error) {
        logger_1.logger.error('Failed to generate embedding:', error);
        throw error;
    }
}
/**
 * Upload and index a new document into the RAG Knowledge Base
 */
async function addDocumentToKnowledgeBase(title, content, metadata) {
    try {
        // Generate embedding
        const embedding = await generateEmbedding(content);
        // Save to PostgreSQL using raw query to handle the pgvector type
        await prisma_1.prisma.$executeRaw `
      INSERT INTO "documents" (id, title, content, metadata, embedding, "createdAt")
      VALUES (
        gen_random_uuid(),
        ${title},
        ${content},
        ${metadata ? JSON.stringify(metadata) : null}::jsonb,
        ${embedding}::vector,
        NOW()
      )
    `;
        logger_1.logger.info(`Document "${title}" added to Knowledge Base.`);
    }
    catch (error) {
        logger_1.logger.error('Failed to add document to Knowledge Base:', error);
        throw error;
    }
}
/**
 * Search the Knowledge Base for relevant context using cosine similarity
 */
async function searchKnowledgeBase(query, matchCount = 3) {
    try {
        const queryEmbedding = await generateEmbedding(query);
        // Perform vector similarity search
        const results = await prisma_1.prisma.$queryRaw `
      SELECT title, content, 1 - (embedding <=> ${queryEmbedding}::vector) AS similarity
      FROM "documents"
      WHERE embedding IS NOT NULL
      ORDER BY embedding <=> ${queryEmbedding}::vector
      LIMIT ${matchCount}
    `;
        if (results.length === 0)
            return '';
        let context = 'KNOWLEDGE BASE REFERENCE MATERIAL:\n\n';
        results.forEach((doc, i) => {
            // Only include results with decent similarity score
            if (doc.similarity > 0.6) {
                context += `--- Document ${i + 1}: ${doc.title} ---\n${doc.content}\n\n`;
            }
        });
        return context;
    }
    catch (error) {
        logger_1.logger.error('Knowledge Base search failed:', error);
        return '';
    }
}
//# sourceMappingURL=rag.service.js.map