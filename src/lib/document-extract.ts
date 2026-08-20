import Anthropic from "@anthropic-ai/sdk";

export type ExtractedLineItem = {
  description: string;
  quantity: number | null;
  unitPrice: number | null;
  amount: number | null;
};

export type ExtractedDocument = {
  docType: "invoice" | "quote";
  documentNumber: string | null;
  issueDate: string | null; // ISO YYYY-MM-DD
  dueOrExpiryDate: string | null; // ISO YYYY-MM-DD
  currency: string | null;
  status: string | null; // e.g. paid, sent, overdue, draft, accepted, declined
  client: {
    name: string | null;
    email: string | null;
    phone: string | null;
    address: string | null;
  };
  lineItems: ExtractedLineItem[];
  subtotal: number | null;
  taxAmount: number | null;
  total: number | null;
};

const EXTRACTION_TOOL = {
  name: "extracted_document",
  description:
    "Structured data extracted from an old invoice or quote document (Excel, Word, PDF, or a scan/photo of a paper document).",
  input_schema: {
    type: "object" as const,
    properties: {
      docType: { type: "string", enum: ["invoice", "quote"] },
      documentNumber: { type: ["string", "null"] },
      issueDate: { type: ["string", "null"], description: "ISO date YYYY-MM-DD if determinable" },
      dueOrExpiryDate: { type: ["string", "null"], description: "ISO date YYYY-MM-DD if determinable" },
      currency: { type: ["string", "null"], description: "e.g. ZAR, USD" },
      status: {
        type: ["string", "null"],
        description: "If the document indicates payment/response status: paid, sent, overdue, draft, accepted, declined",
      },
      client: {
        type: "object",
        properties: {
          name: { type: ["string", "null"] },
          email: { type: ["string", "null"] },
          phone: { type: ["string", "null"] },
          address: { type: ["string", "null"] },
        },
      },
      lineItems: {
        type: "array",
        items: {
          type: "object",
          properties: {
            description: { type: "string" },
            quantity: { type: ["number", "null"] },
            unitPrice: { type: ["number", "null"] },
            amount: { type: ["number", "null"] },
          },
          required: ["description"],
        },
      },
      subtotal: { type: ["number", "null"] },
      taxAmount: { type: ["number", "null"] },
      total: { type: ["number", "null"] },
    },
    required: ["docType", "lineItems"],
  },
};

const SYSTEM_PROMPT = `You are extracting structured data from an old business document (an invoice or quote) so it can be migrated into a new invoicing system. Extract exactly what is present in the document — never invent client details, amounts, or dates that aren't shown. If a field can't be determined, return null for it. If quantity/unit price are missing but a line amount is shown, still return the description and amount with quantity and unitPrice as null. Dates should be normalized to ISO YYYY-MM-DD when the source format allows a confident conversion.`;

function getClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "Document import needs an ANTHROPIC_API_KEY environment variable to be set (used to read old invoices/quotes)."
    );
  }
  return new Anthropic({ apiKey });
}

function emptyResult(): ExtractedDocument {
  return {
    docType: "invoice",
    documentNumber: null,
    issueDate: null,
    dueOrExpiryDate: null,
    currency: null,
    status: null,
    client: { name: null, email: null, phone: null, address: null },
    lineItems: [],
    subtotal: null,
    taxAmount: null,
    total: null,
  };
}

function normalizeResult(raw: unknown): ExtractedDocument {
  const r = (raw ?? {}) as Partial<ExtractedDocument> & { client?: Partial<ExtractedDocument["client"]> };
  return {
    docType: r.docType === "quote" ? "quote" : "invoice",
    documentNumber: r.documentNumber ?? null,
    issueDate: r.issueDate ?? null,
    dueOrExpiryDate: r.dueOrExpiryDate ?? null,
    currency: r.currency ?? null,
    status: r.status ?? null,
    client: {
      name: r.client?.name ?? null,
      email: r.client?.email ?? null,
      phone: r.client?.phone ?? null,
      address: r.client?.address ?? null,
    },
    lineItems: Array.isArray(r.lineItems)
      ? r.lineItems
          .filter((li) => li && typeof li.description === "string" && li.description.trim())
          .map((li) => ({
            description: li.description.trim(),
            quantity: typeof li.quantity === "number" ? li.quantity : null,
            unitPrice: typeof li.unitPrice === "number" ? li.unitPrice : null,
            amount: typeof li.amount === "number" ? li.amount : null,
          }))
      : [],
    subtotal: typeof r.subtotal === "number" ? r.subtotal : null,
    taxAmount: typeof r.taxAmount === "number" ? r.taxAmount : null,
    total: typeof r.total === "number" ? r.total : null,
  };
}

async function runExtraction(content: Anthropic.MessageParam["content"]): Promise<ExtractedDocument> {
  const anthropic = getClient();
  const model = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5";

  const message = await anthropic.messages.create({
    model,
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    tools: [EXTRACTION_TOOL as unknown as Anthropic.Tool],
    tool_choice: { type: "tool", name: "extracted_document" },
    messages: [{ role: "user", content }],
  });

  const toolUse = message.content.find(
    (block): block is Anthropic.ToolUseBlock => block.type === "tool_use"
  );
  if (!toolUse) {
    return emptyResult();
  }
  return normalizeResult(toolUse.input);
}

/** Extracts structured invoice/quote data from a PDF file's raw bytes. */
export async function extractFromPdf(buffer: Buffer): Promise<ExtractedDocument> {
  return runExtraction([
    {
      type: "document",
      source: { type: "base64", media_type: "application/pdf", data: buffer.toString("base64") },
    },
    {
      type: "text",
      text: "Extract this old invoice or quote into the extracted_document tool. This may be a scanned/photographed document — read it carefully.",
    },
  ]);
}

/** Extracts structured invoice/quote data from an image (scan/photo) of a document. */
export async function extractFromImage(buffer: Buffer, mimeType: string): Promise<ExtractedDocument> {
  return runExtraction([
    {
      type: "image",
      source: { type: "base64", media_type: mimeType as "image/png", data: buffer.toString("base64") },
    },
    {
      type: "text",
      text: "Extract this old invoice or quote (a scan/photo of a paper document) into the extracted_document tool.",
    },
  ]);
}

/** Extracts structured invoice/quote data from plain text already pulled out of a Word or Excel file. */
export async function extractFromText(text: string): Promise<ExtractedDocument> {
  if (!text.trim()) return emptyResult();
  return runExtraction([
    {
      type: "text",
      text: `Extract this old invoice or quote into the extracted_document tool. Raw document content follows:\n\n${text.slice(
        0,
        60000
      )}`,
    },
  ]);
}
