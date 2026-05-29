import { GoogleGenerativeAI } from '@google/generative-ai';
import { prisma } from '../../utils/prisma';
import { logger } from '../../utils/logger';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

/**
 * Generate an embedding for a given text using text-embedding-004
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });
    const result = await model.embedContent(text);
    return result.embedding.values;
  } catch (error) {
    logger.error('Failed to generate embedding:', error);
    throw error;
  }
}

/**
 * Upload and index a new document into the RAG Knowledge Base
 */
export async function addDocumentToKnowledgeBase(title: string, content: string, metadata?: any): Promise<void> {
  try {
    // Generate embedding
    const embedding = await generateEmbedding(content);

    // Save to PostgreSQL using raw query to handle the pgvector type
    await prisma.$executeRaw`
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
    logger.info(`Document "${title}" added to Knowledge Base.`);
  } catch (error) {
    logger.error('Failed to add document to Knowledge Base:', error);
    throw error;
  }
}

/**
 * Search the Knowledge Base for relevant context using cosine similarity
 */
export async function searchKnowledgeBase(query: string, matchCount: number = 3): Promise<string> {
  try {
    const queryEmbedding = await generateEmbedding(query);

    // Perform vector similarity search
    const results = await prisma.$queryRaw<Array<{ title: string; content: string; similarity: number }>>`
      SELECT title, content, 1 - (embedding <=> ${queryEmbedding}::vector) AS similarity
      FROM "documents"
      WHERE embedding IS NOT NULL
      ORDER BY embedding <=> ${queryEmbedding}::vector
      LIMIT ${matchCount}
    `;

    if (results.length === 0) return '';

    let context = 'KNOWLEDGE BASE REFERENCE MATERIAL:\n\n';
    results.forEach((doc, i) => {
      // Only include results with decent similarity score
      if (doc.similarity > 0.6) {
        context += `--- Document ${i + 1}: ${doc.title} ---\n${doc.content}\n\n`;
      }
    });

    return context;
  } catch (error) {
    logger.error('Knowledge Base search failed:', error);
    return '';
  }
}
