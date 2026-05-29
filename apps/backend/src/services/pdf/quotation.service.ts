import PDFDocument from 'pdfkit';
import { Readable } from 'stream';
import { COMPANY } from '../../utils/company';
import { logger } from '../../utils/logger';

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

export async function generateQuotationPDF(data: QuotationData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const buffers: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      const primaryColor = '#1e40af';   // Deep blue
      const accentColor = '#f59e0b';    // Amber
      const lightGray = '#f8fafc';
      const darkText = '#1e293b';
      const mutedText = '#64748b';

      const pageWidth = doc.page.width - 100; // with margins

      // ── HEADER ────────────────────────────────────────────────────────────
      // Company name block
      doc.rect(0, 0, doc.page.width, 120).fill(primaryColor);

      doc.fillColor('white')
        .fontSize(28)
        .font('Helvetica-Bold')
        .text(COMPANY.name, 50, 25, { align: 'left' });

      doc.fontSize(10)
        .font('Helvetica')
        .text(COMPANY.tagline, 50, 58, { align: 'left' });

      doc.fontSize(9)
        .text(`${COMPANY.address}`, 50, 75, { align: 'left' });

      doc.text(
        `Ph: ${COMPANY.phone1} / ${COMPANY.phone2}  |  Email: ${COMPANY.email}  |  GSTIN: ${COMPANY.gstin}`,
        50, 90
      );

      // QUOTATION label on right side of header
      doc.fontSize(22)
        .font('Helvetica-Bold')
        .text('QUOTATION', 0, 35, { align: 'right', width: doc.page.width - 50 });

      doc.fillColor(accentColor)
        .fontSize(11)
        .text(`# ${data.quotationNumber}`, 0, 60, { align: 'right', width: doc.page.width - 50 });

      doc.fillColor('white')
        .fontSize(9)
        .font('Helvetica')
        .text(`Date: ${formatDate(data.date)}`, 0, 78, { align: 'right', width: doc.page.width - 50 })
        .text(`Valid Until: ${formatDate(data.validUntil)}`, 0, 92, { align: 'right', width: doc.page.width - 50 });

      // ── BILL TO / FROM ────────────────────────────────────────────────────
      doc.moveDown(4);
      const billY = 140;

      // Bill To box
      doc.rect(50, billY, 240, 100).fill(lightGray).stroke('#e2e8f0');
      doc.fillColor(primaryColor).fontSize(9).font('Helvetica-Bold')
        .text('BILL TO', 60, billY + 8);
      doc.fillColor(darkText).fontSize(11).font('Helvetica-Bold')
        .text(data.customer.company || data.customer.name, 60, billY + 24);
      doc.fillColor(darkText).fontSize(9).font('Helvetica')
        .text(data.customer.name, 60, billY + 40)
        .text(data.customer.address || '', 60, billY + 52, { width: 220 });
      if (data.customer.city || data.customer.state) {
        doc.text(`${data.customer.city || ''}, ${data.customer.state || ''}`, 60, billY + 70);
      }
      if (data.customer.phone) doc.text(`Ph: ${data.customer.phone}`, 60, billY + 82);
      if (data.customer.gst) {
        doc.fillColor(primaryColor).fontSize(8).font('Helvetica-Bold')
          .text(`GSTIN: ${data.customer.gst}`, 60, billY + 94);
      }

      // From box
      doc.rect(310, billY, 240, 100).fill(lightGray).stroke('#e2e8f0');
      doc.fillColor(primaryColor).fontSize(9).font('Helvetica-Bold')
        .text('FROM', 320, billY + 8);
      doc.fillColor(darkText).fontSize(11).font('Helvetica-Bold')
        .text(COMPANY.name, 320, billY + 24);
      doc.fillColor(darkText).fontSize(9).font('Helvetica')
        .text(COMPANY.ownerName + ' (' + COMPANY.designation + ')', 320, billY + 40)
        .text('Nagpur, Maharashtra - 440008', 320, billY + 52)
        .text(`Ph: ${COMPANY.phone1}`, 320, billY + 64)
        .text(`Email: ${COMPANY.email}`, 320, billY + 76);
      doc.fillColor(primaryColor).fontSize(8).font('Helvetica-Bold')
        .text(`GSTIN: ${COMPANY.gstin}`, 320, billY + 90);

      // ── ITEMS TABLE ───────────────────────────────────────────────────────
      const tableTop = billY + 115;

      // Table header
      doc.rect(50, tableTop, pageWidth, 22).fill(primaryColor);
      doc.fillColor('white').fontSize(9).font('Helvetica-Bold');

      const cols = { sn: 50, name: 80, qty: 310, unit: 355, tax: 400, total: 455 };
      doc.text('#', cols.sn + 5, tableTop + 7)
        .text('Product / Description', cols.name + 3, tableTop + 7)
        .text('Qty', cols.qty + 3, tableTop + 7)
        .text('Unit Price', cols.unit - 10, tableTop + 7)
        .text('GST %', cols.tax, tableTop + 7)
        .text('Total', cols.total + 5, tableTop + 7);

      // Table rows
      let rowY = tableTop + 22;
      data.items.forEach((item, i) => {
        const bgColor = i % 2 === 0 ? 'white' : '#f8fafc';
        const rowHeight = item.description ? 36 : 22;
        doc.rect(50, rowY, pageWidth, rowHeight).fill(bgColor).stroke('#e2e8f0');

        doc.fillColor(darkText).fontSize(9).font('Helvetica')
          .text(`${i + 1}`, cols.sn + 5, rowY + 7)
          .text(item.name, cols.name + 3, rowY + 7, { width: 220 });

        if (item.description) {
          doc.fillColor(mutedText).fontSize(8)
            .text(item.description, cols.name + 3, rowY + 18, { width: 220 });
        }

        doc.fillColor(darkText).fontSize(9)
          .text(`${item.quantity}`, cols.qty + 3, rowY + 7)
          .text(`₹${formatAmount(item.unitPrice)}`, cols.unit - 10, rowY + 7, { width: 50, align: 'right' })
          .text(`${item.taxRate}%`, cols.tax + 5, rowY + 7)
          .text(`₹${formatAmount(item.total)}`, cols.total + 5, rowY + 7, { width: 60, align: 'right' });

        rowY += rowHeight;
      });

      // ── TOTALS ────────────────────────────────────────────────────────────
      rowY += 10;
      const totalsX = 360;
      const totalsWidth = 190;

      const drawTotalRow = (label: string, value: string, isBold = false, bgFill?: string) => {
        if (bgFill) {
          doc.rect(totalsX, rowY, totalsWidth, 20).fill(bgFill);
        }
        doc.fillColor(isBold ? 'white' : darkText)
          .fontSize(9)
          .font(isBold ? 'Helvetica-Bold' : 'Helvetica')
          .text(label, totalsX + 10, rowY + 5)
          .text(value, totalsX, rowY + 5, { align: 'right', width: totalsWidth - 10 });
        rowY += 20;
      };

      drawTotalRow('Subtotal:', `₹${formatAmount(data.subtotal)}`);
      drawTotalRow('GST Amount:', `₹${formatAmount(data.taxAmount)}`);
      if (data.discountAmount > 0) {
        drawTotalRow('Discount:', `-₹${formatAmount(data.discountAmount)}`);
      }
      doc.rect(totalsX, rowY, totalsWidth, 24).fill(primaryColor);
      drawTotalRow('GRAND TOTAL:', `₹${formatAmount(data.grandTotal)}`, true, primaryColor);

      // Amount in words
      rowY += 5;
      doc.fillColor(mutedText).fontSize(8).font('Helvetica-Oblique')
        .text(`Amount in words: ${numberToWords(Math.round(data.grandTotal))} Rupees Only`, 50, rowY);

      // ── TERMS ─────────────────────────────────────────────────────────────
      rowY += 20;
      doc.fillColor(primaryColor).fontSize(10).font('Helvetica-Bold')
        .text('Terms & Conditions', 50, rowY);
      rowY += 14;

      const terms = [...COMPANY.termsAndConditions];
      if (data.deliveryTerms) terms.unshift(`Delivery: ${data.deliveryTerms}`);
      if (data.paymentTerms) terms.unshift(`Payment: ${data.paymentTerms}`);
      if (data.warranty) terms.push(`Warranty: ${data.warranty}`);

      terms.forEach((term) => {
        doc.fillColor(darkText).fontSize(8).font('Helvetica')
          .text(`• ${term}`, 50, rowY, { width: pageWidth });
        rowY += 12;
      });

      // ── SIGNATURE ─────────────────────────────────────────────────────────
      rowY += 15;
      doc.rect(350, rowY, 200, 55).stroke('#e2e8f0');
      doc.fillColor(mutedText).fontSize(8)
        .text('Authorised Signatory', 355, rowY + 38)
        .text(COMPANY.name, 355, rowY + 48);
      doc.fillColor(primaryColor).fontSize(9).font('Helvetica-Bold')
        .text(COMPANY.ownerName, 355, rowY + 6)
        .text(COMPANY.designation, 355, rowY + 18);

      // ── FOOTER ────────────────────────────────────────────────────────────
      const footerY = doc.page.height - 45;
      doc.rect(0, footerY, doc.page.width, 45).fill(primaryColor);
      doc.fillColor('white').fontSize(8).font('Helvetica')
        .text(
          `${COMPANY.name} | ${COMPANY.address} | ${COMPANY.phone1} | ${COMPANY.email}`,
          0, footerY + 10, { align: 'center', width: doc.page.width }
        )
        .text(
          `GSTIN: ${COMPANY.gstin} | Bank: ${COMPANY.bank.bankName} | A/C: ${COMPANY.bank.accountNumber} | IFSC: ${COMPANY.bank.ifsc}`,
          0, footerY + 24, { align: 'center', width: doc.page.width }
        );

      doc.end();
    } catch (error) {
      logger.error('PDF generation error:', error);
      reject(error);
    }
  });
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatAmount(amount: number): string {
  return new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
}

function numberToWords(num: number): string {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  if (num === 0) return 'Zero';
  if (num < 0) return 'Negative ' + numberToWords(-num);

  let words = '';
  if (num >= 10000000) { words += numberToWords(Math.floor(num / 10000000)) + ' Crore '; num %= 10000000; }
  if (num >= 100000) { words += numberToWords(Math.floor(num / 100000)) + ' Lakh '; num %= 100000; }
  if (num >= 1000) { words += numberToWords(Math.floor(num / 1000)) + ' Thousand '; num %= 1000; }
  if (num >= 100) { words += ones[Math.floor(num / 100)] + ' Hundred '; num %= 100; }
  if (num >= 20) { words += tens[Math.floor(num / 10)] + ' '; num %= 10; }
  if (num > 0) { words += ones[num] + ' '; }

  return words.trim();
}
