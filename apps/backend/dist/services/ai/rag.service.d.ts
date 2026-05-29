/**
 * Generate an embedding for a given text using text-embedding-004
 */
export declare function generateEmbedding(text: string): Promise<number[]>;
/**
 * Upload and index a new document into the RAG Knowledge Base
 */
export declare function addDocumentToKnowledgeBase(title: string, content: string, metadata?: any): Promise<void>;
/**
 * Search the Knowledge Base for relevant context using cosine similarity
 */
export declare function searchKnowledgeBase(query: string, matchCount?: number): Promise<string>;
//# sourceMappingURL=rag.service.d.ts.map