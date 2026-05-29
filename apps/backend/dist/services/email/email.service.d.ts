export declare function sendQuotationEmail(params: {
    to: string;
    customerName: string;
    quotationNumber: string;
    grandTotal: number;
    pdfBuffer: Buffer;
}): Promise<void>;
export declare function sendFollowUpEmail(params: {
    to: string;
    customerName: string;
    message: string;
    followUpNumber: number;
}): Promise<void>;
export declare function sendWelcomeEmail(params: {
    to: string;
    customerName: string;
    autoReply: string;
}): Promise<void>;
//# sourceMappingURL=email.service.d.ts.map