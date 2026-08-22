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
      // Without these, a blocked/unreachable port (e.g. a host that
      // firewalls outbound 465) hangs the underlying socket for minutes
      // before nodemailer's own default timeout kicks in — which means a
      // Server Action calling this just sits there, and the user watches a
      // "Sending…" button do nothing for that whole time. Fail fast instead.
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 10_000,
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

export async function sendQuoteEmail(opts: {
  to: string;
  businessName: string;
  quoteNumber: string;
  total: string;
  expiryDate: string;
  pdfBuffer: Buffer;
  message?: string;
}) {
  const t = getTransporter();
  const info = await t.sendMail({
    from: process.env.SMTP_FROM || `"${opts.businessName}" <no-reply@invoicing.local>`,
    to: opts.to,
    subject: `Quote ${opts.quoteNumber} from ${opts.businessName}`,
    text:
      opts.message ||
      `Hi,\n\nPlease find attached quote ${opts.quoteNumber} for ${opts.total}, valid until ${opts.expiryDate}.\n\nThank you,\n${opts.businessName}`,
    attachments: [
      {
        filename: `${opts.quoteNumber}.pdf`,
        content: opts.pdfBuffer,
        contentType: "application/pdf",
      },
    ],
  });

  if (!process.env.SMTP_HOST) {
    console.log(`[mailer] SMTP not configured — email logged only. To: ${opts.to}, Quote: ${opts.quoteNumber}`);
  }

  return info;
}

// "Report a problem" notification, sent to the Invoicely operator (not a
// client of one of our businesses). Set SUPPORT_NOTIFY_EMAIL on Railway to
// where these should land; falls back to SMTP_FROM's address if unset.
export async function sendSupportTicketEmail(opts: {
  businessName: string;
  businessEmail: string;
  userEmail?: string | null;
  message: string;
  pageUrl?: string | null;
  ticketId: string;
}) {
  const to = process.env.SUPPORT_NOTIFY_EMAIL || process.env.SMTP_FROM;
  if (!to) {
    console.log(`[mailer] No SUPPORT_NOTIFY_EMAIL/SMTP_FROM configured — support ticket ${opts.ticketId} logged only.`);
    return null;
  }

  const t = getTransporter();
  const info = await t.sendMail({
    from: process.env.SMTP_FROM || `"Invoicely" <no-reply@invoicing.local>`,
    to,
    replyTo: opts.userEmail || undefined,
    subject: `[Invoicely support] ${opts.businessName}`,
    text: [
      `Business: ${opts.businessName} (${opts.businessEmail})`,
      opts.userEmail ? `Reported by: ${opts.userEmail}` : null,
      opts.pageUrl ? `Page: ${opts.pageUrl}` : null,
      `Ticket ID: ${opts.ticketId}`,
      "",
      opts.message,
    ]
      .filter(Boolean)
      .join("\n"),
  });

  if (!process.env.SMTP_HOST) {
    console.log(`[mailer] SMTP not configured — support ticket ${opts.ticketId} logged only.`);
  }

  return info;
}
