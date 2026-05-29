import nodemailer from 'nodemailer';
import { COMPANY } from '../../utils/company';
import { logger } from '../../utils/logger';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER || COMPANY.email,
    pass: process.env.SMTP_PASS,
  },
});

// ─── Send Quotation Email ──────────────────────────────────────────────────
export async function sendQuotationEmail(params: {
  to: string;
  customerName: string;
  quotationNumber: string;
  grandTotal: number;
  pdfBuffer: Buffer;
}): Promise<void> {
  const { to, customerName, quotationNumber, grandTotal, pdfBuffer } = params;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #f1f5f9; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #1e40af, #3b82f6); padding: 30px; text-align: center; }
    .header h1 { color: white; margin: 0; font-size: 24px; }
    .header p { color: rgba(255,255,255,0.85); margin: 5px 0 0; font-size: 13px; }
    .body { padding: 30px; }
    .greeting { font-size: 16px; color: #1e293b; font-weight: 600; }
    .content { color: #475569; line-height: 1.7; margin: 15px 0; }
    .quotation-box { background: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid #1e40af; border-radius: 8px; padding: 20px; margin: 20px 0; }
    .quotation-box .label { font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
    .quotation-box .value { font-size: 20px; color: #1e40af; font-weight: 700; margin: 4px 0; }
    .cta { display: inline-block; background: linear-gradient(135deg, #1e40af, #3b82f6); color: white; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 15px 0; }
    .footer { background: #1e293b; padding: 20px; text-align: center; }
    .footer p { color: #94a3b8; font-size: 12px; margin: 3px 0; }
    .contact-info { display: flex; gap: 15px; justify-content: center; flex-wrap: wrap; margin-top: 10px; }
    .contact-info span { color: #cbd5e1; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${COMPANY.name}</h1>
      <p>${COMPANY.tagline}</p>
    </div>
    <div class="body">
      <p class="greeting">Dear ${customerName},</p>
      <p class="content">
        Thank you for your inquiry. Please find attached your quotation from <strong>${COMPANY.name}</strong>. 
        We have carefully prepared this quotation based on your requirements.
      </p>
      <div class="quotation-box">
        <div class="label">Quotation Number</div>
        <div class="value">${quotationNumber}</div>
        <div class="label" style="margin-top:10px">Grand Total (Incl. GST)</div>
        <div class="value">₹${new Intl.NumberFormat('en-IN').format(grandTotal)}</div>
      </div>
      <p class="content">
        The quotation is attached as a PDF. Please review it at your convenience. 
        This quotation is valid for <strong>15 days</strong> from the date of issue.
      </p>
      <p class="content">
        If you have any questions or require any modifications, please don't hesitate to contact us. 
        We look forward to the opportunity to serve you.
      </p>
      <p style="color:#475569; font-size:14px; margin-top: 20px;">
        Warm Regards,<br>
        <strong>${COMPANY.ownerName}</strong><br>
        <span style="color:#64748b;">${COMPANY.designation} | ${COMPANY.name}</span><br>
        <span style="color:#1e40af;">📞 ${COMPANY.phone1} | ✉️ ${COMPANY.email}</span>
      </p>
    </div>
    <div class="footer">
      <p><strong style="color:white;">${COMPANY.name}</strong></p>
      <p>${COMPANY.address}</p>
      <div class="contact-info">
        <span>📞 ${COMPANY.phone1}</span>
        <span>✉️ ${COMPANY.email}</span>
        <span>🏛️ GSTIN: ${COMPANY.gstin}</span>
      </div>
    </div>
  </div>
</body>
</html>`;

  await transporter.sendMail({
    from: `"${COMPANY.name}" <${process.env.SMTP_USER || COMPANY.email}>`,
    to,
    subject: `Quotation ${quotationNumber} from ${COMPANY.name}`,
    html,
    attachments: [{
      filename: `Quotation_${quotationNumber}.pdf`,
      content: pdfBuffer,
      contentType: 'application/pdf',
    }],
  });

  logger.info(`Quotation email sent to ${to}`);
}

// ─── Send Follow-Up Email ──────────────────────────────────────────────────
export async function sendFollowUpEmail(params: {
  to: string;
  customerName: string;
  message: string;
  followUpNumber: number;
}): Promise<void> {
  const { to, customerName, message, followUpNumber } = params;

  const subjects = [
    `Following up on your inquiry — ${COMPANY.name}`,
    `Have you had a chance to review our quotation? — ${COMPANY.name}`,
    `Final follow-up: We would love to assist you — ${COMPANY.name}`,
  ];

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #f1f5f9; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #1e40af, #3b82f6); padding: 25px 30px; }
    .header h1 { color: white; margin: 0; font-size: 20px; }
    .body { padding: 30px; color: #475569; line-height: 1.8; }
    .footer { background: #1e293b; padding: 15px; text-align: center; }
    .footer p { color: #94a3b8; font-size: 11px; margin: 2px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header"><h1>${COMPANY.name}</h1></div>
    <div class="body">
      <p>Dear ${customerName},</p>
      <p>${message.replace(/\n/g, '<br>')}</p>
      <p style="margin-top: 20px;">
        Best Regards,<br>
        <strong style="color:#1e293b;">${COMPANY.ownerName}</strong><br>
        <span style="color:#64748b; font-size:13px;">${COMPANY.designation} | ${COMPANY.name}</span><br>
        <span style="color:#1e40af; font-size:13px;">📞 ${COMPANY.phone1} | ✉️ ${COMPANY.email}</span>
      </p>
    </div>
    <div class="footer">
      <p>${COMPANY.name} | ${COMPANY.city}, ${COMPANY.state}</p>
      <p>GSTIN: ${COMPANY.gstin}</p>
    </div>
  </div>
</body>
</html>`;

  await transporter.sendMail({
    from: `"${COMPANY.name}" <${process.env.SMTP_USER || COMPANY.email}>`,
    to,
    subject: subjects[followUpNumber - 1] || subjects[0],
    html,
  });

  logger.info(`Follow-up #${followUpNumber} email sent to ${to}`);
}

// ─── Send Welcome / New Lead Email ─────────────────────────────────────────
export async function sendWelcomeEmail(params: { to: string; customerName: string; autoReply: string }): Promise<void> {
  const { to, customerName, autoReply } = params;

  const html = `
<!DOCTYPE html>
<html>
<body style="font-family: 'Segoe UI', Arial, sans-serif; background: #f1f5f9; padding: 20px;">
  <div style="max-width:600px; margin:0 auto; background:white; border-radius:12px; overflow:hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
    <div style="background: linear-gradient(135deg, #1e40af, #3b82f6); padding: 25px 30px;">
      <h1 style="color:white; margin:0; font-size:20px;">${COMPANY.name}</h1>
      <p style="color:rgba(255,255,255,0.8); margin:4px 0 0; font-size:12px;">${COMPANY.tagline}</p>
    </div>
    <div style="padding: 30px; color: #475569; line-height: 1.8;">
      <p>Dear ${customerName},</p>
      <p>${autoReply.replace(/\n/g, '<br>')}</p>
      <p style="margin-top:20px;">
        Best Regards,<br>
        <strong style="color:#1e293b;">${COMPANY.ownerName}</strong><br>
        <span style="color:#64748b; font-size:13px;">${COMPANY.designation} | ${COMPANY.name}</span><br>
        <span style="color:#1e40af; font-size:13px;">📞 ${COMPANY.phone1} | ✉️ ${COMPANY.email}</span>
      </p>
    </div>
    <div style="background:#1e293b; padding:15px; text-align:center;">
      <p style="color:#94a3b8; font-size:11px; margin:2px 0;">${COMPANY.name} | ${COMPANY.address}</p>
      <p style="color:#94a3b8; font-size:11px; margin:2px 0;">GSTIN: ${COMPANY.gstin} | Bank A/C: ${COMPANY.bank.accountNumber} | IFSC: ${COMPANY.bank.ifsc}</p>
    </div>
  </div>
</body>
</html>`;

  await transporter.sendMail({
    from: `"${COMPANY.name}" <${process.env.SMTP_USER || COMPANY.email}>`,
    to,
    subject: `Thank you for your inquiry — ${COMPANY.name}`,
    html,
  });
}
