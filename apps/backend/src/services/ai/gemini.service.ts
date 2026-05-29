import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { COMPANY } from '../../utils/company';
import { logger } from '../../utils/logger';
import { searchKnowledgeBase } from './rag.service';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const SYSTEM_PROMPT = `You are Rahul, a highly experienced Senior B2B Sales Executive at ${COMPANY.name}, a leading IT solutions company based in Nagpur, Maharashtra. 

COMPANY PROFILE:
- Company: ${COMPANY.name}
- Owner: ${COMPANY.ownerName} (${COMPANY.designation})
- Location: ${COMPANY.address}
- Phone: ${COMPANY.phone1} / ${COMPANY.phone2}
- Email: ${COMPANY.email}
- GSTIN: ${COMPANY.gstin}

PRODUCTS & SERVICES:
- Laptops & Computers (Dell, HP, Lenovo)
- Printers (HP, Epson, Canon)
- CCTV Security Systems (Hikvision, CP Plus)
- Networking Equipment (TP-Link, Cisco)
- Computer Accessories
- Software Installation (Windows, MS Office)
- Hardware Upgrades (RAM, SSD)
- Annual Maintenance Contracts (AMC)
- Computer Repair Services
- Technical Support

YOUR PERSONA:
- Professional, friendly, and highly knowledgeable B2B Sales Executive
- You understand Indian business context deeply
- You are solution-oriented and customer-centric
- You always aim to qualify leads and move them forward in the sales pipeline
- You never use Hindi, Hinglish, or slang - always professional business English
- You are concise, clear, and actionable

CONVERSATION OBJECTIVES:
1. Understand the customer's exact requirement
2. Gather key qualifying information: quantity, budget, timeline, location, company type
3. Recommend the most suitable products/services
4. Handle objections confidently
5. Move towards quotation generation
6. Create urgency where appropriate

QUALIFYING QUESTIONS TO ASK (one at a time, naturally):
- What is the quantity required?
- What is your approximate budget per unit / total budget?
- What is your preferred delivery timeline?
- Is this for personal or business use?
- What city/location for delivery?
- What specifications are you looking for?

RESPONSE STYLE:
- Keep responses concise (2-4 sentences max unless explaining technical details)
- Always end with a question or a clear next step
- Be warm but professional
- Use bullet points for product recommendations or specs
- Express genuine interest in solving their problem

IMPORTANT RULES:
- NEVER respond in Hindi, Hinglish, or any language other than professional English
- NEVER make up prices you don't know — say "let me prepare a detailed quotation for you"
- NEVER be pushy or aggressive
- ALWAYS gather missing information before recommending
- If customer asks for a quotation, acknowledge and say the team will prepare it shortly`;

const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
];

export interface ChatMessage {
  role: 'user' | 'model';
  parts: [{ text: string }];
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

// ─── Main Chat Function ────────────────────────────────────────────────────
export async function sendAIMessage(
  userMessage: string,
  conversationHistory: ChatMessage[] = []
): Promise<AIResponse> {
  try {
    // Check Knowledge Base for relevant context
    const ragContext = await searchKnowledgeBase(userMessage);

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-pro',
      systemInstruction: SYSTEM_PROMPT + (ragContext ? '\n\n' + ragContext : ''),
      safetySettings,
      generationConfig: {
        temperature: 0.7,
        topP: 0.95,
        maxOutputTokens: 1024,
      },
    });

    const chat = model.startChat({ history: conversationHistory });
    const result = await chat.sendMessage(userMessage);
    const responseText = result.response.text();

    return { message: responseText };
  } catch (error) {
    logger.error('Gemini AI error:', error);
    return {
      message: 'Thank you for your inquiry. Our sales team will review your requirements and get back to you shortly. Could you please share your contact number for a quick call?',
    };
  }
}

// ─── Lead Qualification ───────────────────────────────────────────────────
export async function qualifyLead(leadData: {
  name: string;
  company?: string;
  query?: string;
  budget?: string;
  quantity?: string;
  urgency?: string;
  purchaseIntent?: string;
  conversationSummary?: string;
}): Promise<{ score: number; temperature: 'HOT' | 'WARM' | 'COLD'; reasoning: string; qualificationData: Record<string, string> }> {
  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-pro',
      generationConfig: { temperature: 0.3, maxOutputTokens: 512 },
    });

    const prompt = `You are a B2B lead qualification expert. Score this lead from 0-100 and classify as HOT/WARM/COLD.

LEAD INFORMATION:
- Name: ${leadData.name}
- Company: ${leadData.company || 'Not specified'}
- Query/Requirement: ${leadData.query || 'Not specified'}
- Budget: ${leadData.budget || 'Not specified'}
- Quantity: ${leadData.quantity || 'Not specified'}
- Urgency: ${leadData.urgency || 'Not specified'}
- Purchase Intent: ${leadData.purchaseIntent || 'Not specified'}
- Conversation Summary: ${leadData.conversationSummary || 'No conversation yet'}

SCORING CRITERIA:
- Budget clarity (0-25 pts): Specific budget = 25, Range = 15, Vague = 5, None = 0
- Quantity (0-20 pts): Large quantity = 20, Small = 10, Vague = 5
- Urgency (0-20 pts): Immediate/urgent = 20, Within month = 15, Future = 5
- Purchase intent (0-20 pts): Ready to buy = 20, Evaluating = 10, Just browsing = 5  
- Engagement (0-15 pts): Multiple messages, answers questions = 15, One message = 5

Respond ONLY in this exact JSON format:
{
  "score": <number 0-100>,
  "temperature": "<HOT|WARM|COLD>",
  "reasoning": "<one sentence explanation>",
  "detectedBudget": "<extracted budget or Unknown>",
  "detectedQuantity": "<extracted quantity or Unknown>",
  "detectedUrgency": "<HIGH|MEDIUM|LOW>",
  "detectedIntent": "<HIGH|MEDIUM|LOW>"
}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        score: Math.min(100, Math.max(0, parsed.score)),
        temperature: parsed.temperature as 'HOT' | 'WARM' | 'COLD',
        reasoning: parsed.reasoning,
        qualificationData: {
          budget: parsed.detectedBudget,
          quantity: parsed.detectedQuantity,
          urgency: parsed.detectedUrgency,
          purchaseIntent: parsed.detectedIntent,
        },
      };
    }

    return { score: 30, temperature: 'COLD', reasoning: 'Insufficient data to qualify', qualificationData: {} };
  } catch (error) {
    logger.error('Lead qualification error:', error);
    return { score: 30, temperature: 'COLD', reasoning: 'Qualification failed', qualificationData: {} };
  }
}

// ─── Generate Follow-Up Message ────────────────────────────────────────────
export async function generateFollowUpMessage(leadData: {
  name: string;
  company?: string;
  lastQuery?: string;
  followUpNumber: number;
  daysSinceContact: number;
}): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-pro',
      generationConfig: { temperature: 0.8, maxOutputTokens: 300 },
    });

    const followUpContext = leadData.followUpNumber === 1
      ? 'first follow-up, 24 hours after initial contact'
      : leadData.followUpNumber === 2
      ? 'second follow-up, 3 days after initial contact'
      : 'third follow-up, 7 days after initial contact, last attempt before marking inactive';

    const prompt = `Write a professional B2B sales follow-up email/message for this context:

Context: This is the ${followUpContext}.
Customer: ${leadData.name} ${leadData.company ? `from ${leadData.company}` : ''}
Original Query: ${leadData.lastQuery || 'IT products/services inquiry'}
From: ${COMPANY.ownerName}, ${COMPANY.name}

Write ONLY the message body (no subject line). Keep it:
- Professional and warm
- 3-4 sentences max
- Create soft urgency
- Include a clear call to action
- End with contact details: ${COMPANY.phone1}

Do NOT use Hindi, Hinglish, or informal language.`;

    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch (error) {
    logger.error('Follow-up generation error:', error);
    return `Dear ${leadData.name},\n\nI hope you are doing well. I wanted to follow up regarding your inquiry with ASN Expo. We would love to assist you with your IT requirements.\n\nPlease feel free to reach out at ${COMPANY.phone1} or reply to this message.\n\nBest regards,\n${COMPANY.ownerName}\n${COMPANY.name}`;
  }
}

// ─── Auto Reply for New Inquiry ────────────────────────────────────────────
export async function generateAutoReply(inquiry: string, customerName?: string): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-pro',
      systemInstruction: SYSTEM_PROMPT,
      generationConfig: { temperature: 0.7, maxOutputTokens: 300 },
    });

    const prompt = `A new customer just sent this inquiry: "${inquiry}"
Customer name: ${customerName || 'Customer'}

Generate a professional, friendly auto-reply that:
1. Acknowledges their inquiry
2. Shows you understand what they need
3. Asks 1-2 key qualifying questions (quantity, budget, timeline, or specs - pick the most relevant)
4. Keeps it under 4 sentences

Respond ONLY with the message text.`;

    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch (error) {
    logger.error('Auto reply generation error:', error);
    return `Thank you for your inquiry, ${customerName || 'valued customer'}! We at ${COMPANY.name} are glad to assist you. Could you please share the quantity required and your approximate budget? This will help us provide you the best recommendation and a detailed quotation.`;
  }
}

// ─── Product Recommendation ────────────────────────────────────────────────
export async function recommendProducts(requirement: string, budget?: string, quantity?: string): Promise<string> {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-pro',
    systemInstruction: SYSTEM_PROMPT,
    generationConfig: { temperature: 0.5, maxOutputTokens: 400 },
  });

  const prompt = `Based on this customer requirement, recommend suitable products from our catalog:

Requirement: ${requirement}
Budget: ${budget || 'Not specified'}
Quantity: ${quantity || 'Not specified'}

Our categories: Laptops, Computers, Printers, CCTV Systems, Networking Equipment, Computer Accessories, Software, AMC Services

Provide a brief recommendation with 2-3 product suggestions and why they're suitable.`;

  const result = await model.generateContent(prompt);
  return result.response.text().trim();
}
