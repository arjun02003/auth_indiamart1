export interface ChatMessage {
    role: 'user' | 'model';
    parts: [{
        text: string;
    }];
}
export interface AIResponse {
    message: string;
    qualificationData?: {
        budget?: string;
        quantity?: string;
        urgency?: string;
        purchaseIntent?: string;
        productCategory?: string;
        requirements?: string;
    };
    suggestedActions?: string[];
}
export declare function sendAIMessage(userMessage: string, conversationHistory?: ChatMessage[]): Promise<AIResponse>;
export declare function qualifyLead(leadData: {
    name: string;
    company?: string;
    query?: string;
    budget?: string;
    quantity?: string;
    urgency?: string;
    purchaseIntent?: string;
    conversationSummary?: string;
}): Promise<{
    score: number;
    temperature: 'HOT' | 'WARM' | 'COLD';
    reasoning: string;
    qualificationData: Record<string, string>;
}>;
export declare function generateFollowUpMessage(leadData: {
    name: string;
    company?: string;
    lastQuery?: string;
    followUpNumber: number;
    daysSinceContact: number;
}): Promise<string>;
export declare function generateAutoReply(inquiry: string, customerName?: string): Promise<string>;
export declare function recommendProducts(requirement: string, budget?: string, quantity?: string): Promise<string>;
//# sourceMappingURL=gemini.service.d.ts.map