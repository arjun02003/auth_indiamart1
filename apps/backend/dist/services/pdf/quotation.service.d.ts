interface QuotationItem {
    name: string;
    description?: string;
    quantity: number;
    unitPrice: number;
    taxRate: number;
    taxAmount: number;
    total: number;
}
interface QuotationData {
    quotationNumber: string;
    date: Date;
    validUntil: Date;
    customer: {
        name: string;
        company?: string;
        address?: string;
        city?: string;
        state?: string;
        phone?: string;
        email?: string;
        gst?: string;
    };
    items: QuotationItem[];
    subtotal: number;
    taxAmount: number;
    discountAmount: number;
    grandTotal: number;
    deliveryTerms?: string;
    paymentTerms?: string;
    warranty?: string;
    notes?: string;
}
export declare function generateQuotationPDF(data: QuotationData): Promise<Buffer>;
export {};
//# sourceMappingURL=quotation.service.d.ts.map