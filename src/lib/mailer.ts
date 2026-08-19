import nodemailer from "nodemailer";

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (transporter) return transporter;

  if (process.env.SMTP_HOST) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === "true",
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
    });
  } else {
    // No SMTP configured: log emails to console instead of sending (dev fallback).
    transporter = nodemailer.createTransport({ jsonTransport: true });
  }
  return transporter;
}

export async function sendInvoiceEmail(opts: {
  to: string;
  businessName: string;
  invoiceNumber: string;
  total: string;
  dueDate: string;
  pdfBuffer: Buffer;
  message?: string;
}) {
  const t = getTransporter();
  const info = await t.sendMail({
    from: process.env.SMTP_FROM || `"${opts.businessName}" <no-reply@invoicing.local>`,
    to: opts.to,
    subject: `Invoice ${opts.invoiceNumber} from ${opts.businessName}`,
    text:
      opts.message ||
      `Hi,\n\nPlease find attached invoice ${opts.invoiceNumber} for ${opts.total}, due ${opts.dueDate}.\n\nThank you,\n${opts.businessName}`,
    attachments: [
      {
        filename: `${opts.invoiceNumber}.pdf`,
        content: opts.pdfBuffer,
        contentType: "application/pdf",
      },
    ],
  });

  if (!process.env.SMTP_HOST) {
    console.log(`[mailer] SMTP not configured — email logged only. To: ${opts.to}, Invoice: ${opts.invoiceNumber}`);
  }

  return info;
}
