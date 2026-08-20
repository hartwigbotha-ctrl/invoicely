"use server";

import { db } from "@/db";
import {
  documentImports,
  clients,
  items,
  invoices,
  invoiceLineItems,
  quotes,
  quoteLineItems,
} from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { requireBusiness } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { parseUploadedFile } from "@/lib/document-parse-file";
import { hasProAccess } from "@/lib/plan-access";
import { calcTotals, nextInvoiceNumber, nextQuoteNumber } from "@/lib/invoice-utils";
import { formatISO } from "date-fns";
import type { ExtractedDocument } from "@/lib/document-extract";

async function requireProAccess(businessId: string) {
  const ok = await hasProAccess(businessId);
  if (!ok) {
    throw new Error("Bulk document import is a Pro/Business feature. Upgrade your plan in Settings to use it.");
  }
}

/** Best-effort match against existing clients: exact email match wins, else exact (case-insensitive) name match. */
async function findMatchingClient(businessId: string, extracted: ExtractedDocument["client"]) {
  if (extracted.email) {
    const byEmail = await db.query.clients.findFirst({
      where: and(eq(clients.businessId, businessId), sql`lower(${clients.email}) = lower(${extracted.email})`),
    });
    if (byEmail) return byEmail;
  }
  if (extracted.name) {
    const byName = await db.query.clients.findFirst({
      where: and(eq(clients.businessId, businessId), sql`lower(${clients.name}) = lower(${extracted.name})`),
    });
    if (byName) return byName;
  }
  return null;
}

export async function uploadAndParseDocuments(formData: FormData) {
  const { business } = await requireBusiness();
  await requireProAccess(business.id);

  const files = formData.getAll("files") as File[];
  const validFiles = files.filter((f) => f instanceof File && f.size > 0);
  if (validFiles.length === 0) {
    throw new Error("Choose at least one file to import.");
  }

  for (const file of validFiles) {
    const buffer = Buffer.from(await file.arrayBuffer());
    try {
      const extracted = await parseUploadedFile(file.name, buffer, file.type || "");
      const matched = await findMatchingClient(business.id, extracted.client);

      await db.insert(documentImports).values({
        businessId: business.id,
        fileName: file.name,
        status: "pending",
        docType: extracted.docType,
        extractedJson: JSON.stringify(extracted),
        matchedClientId: matched?.id ?? null,
      });
    } catch (err) {
      await db.insert(documentImports).values({
        businessId: business.id,
        fileName: file.name,
        status: "failed",
        docType: "invoice",
        extractedJson: JSON.stringify({}),
        errorMessage: err instanceof Error ? err.message : "Failed to read this file.",
      });
    }
  }

  revalidatePath("/imports");
  redirect("/imports");
}

export async function discardImport(importId: string) {
  const { business } = await requireBusiness();
  await db
    .delete(documentImports)
    .where(and(eq(documentImports.id, importId), eq(documentImports.businessId, business.id)));
  revalidatePath("/imports");
  redirect("/imports");
}

function parseLineItemsFromForm(formData: FormData) {
  const descriptions = formData.getAll("li_description") as string[];
  const quantities = formData.getAll("li_quantity") as string[];
  const unitPrices = formData.getAll("li_unitPrice") as string[];

  const out: { description: string; quantity: number; unitPrice: number }[] = [];
  for (let i = 0; i < descriptions.length; i++) {
    const description = descriptions[i]?.trim();
    if (!description) continue;
    out.push({
      description,
      quantity: Number(quantities[i] || 0) || 0,
      unitPrice: Number(unitPrices[i] || 0) || 0,
    });
  }
  if (out.length === 0) throw new Error("At least one line item is required");
  return out;
}

/**
 * Turns a reviewed/edited import into a real client + invoice/quote +
 * catalog items. Items are matched to the existing saved-items catalog by
 * name (case-insensitive); anything not found is added to the catalog so
 * future invoices can reuse it.
 */
export async function confirmImport(importId: string, formData: FormData) {
  const { business } = await requireBusiness();
  await requireProAccess(business.id);

  const record = await db.query.documentImports.findFirst({
    where: and(eq(documentImports.id, importId), eq(documentImports.businessId, business.id)),
  });
  if (!record) throw new Error("Import not found");

  const docType = (formData.get("docType") as string) === "quote" ? "quote" : "invoice";
  const status = (formData.get("status") as string) || "draft";
  const issueDate = (formData.get("issueDate") as string) || formatISO(new Date(), { representation: "date" });
  const dueOrExpiryDate =
    (formData.get("dueOrExpiryDate") as string) || formatISO(new Date(), { representation: "date" });
  const taxRate = Number(formData.get("taxRate") || 0);
  const notes = (formData.get("notes") as string) || null;

  // Client: reuse an existing one if selected, otherwise create a new one from the edited fields.
  const selectedClientId = formData.get("clientId") as string;
  let clientId = selectedClientId && selectedClientId !== "__new__" ? selectedClientId : null;

  if (!clientId) {
    const name = (formData.get("clientName") as string)?.trim();
    if (!name) throw new Error("Client name is required");
    const created = await db
      .insert(clients)
      .values({
        businessId: business.id,
        name,
        email: (formData.get("clientEmail") as string) || null,
        phone: (formData.get("clientPhone") as string) || null,
        address: (formData.get("clientAddress") as string) || null,
      })
      .returning();
    clientId = created[0].id;
  }

  const lineItems = parseLineItemsFromForm(formData);
  const { subtotal, taxAmount, total } = calcTotals(lineItems, taxRate);

  // Auto-create catalog items for any line item description we haven't seen before.
  const existingItems = await db.query.items.findMany({ where: eq(items.businessId, business.id) });
  const existingNames = new Set(existingItems.map((it) => it.name.toLowerCase()));
  for (const li of lineItems) {
    if (!existingNames.has(li.description.toLowerCase())) {
      await db.insert(items).values({
        businessId: business.id,
        name: li.description,
        defaultPrice: li.unitPrice,
      });
      existingNames.add(li.description.toLowerCase());
    }
  }

  let createdInvoiceId: string | null = null;
  let createdQuoteId: string | null = null;

  if (docType === "invoice") {
    const number = (formData.get("number") as string) || (await nextInvoiceNumber(business.id));
    const inserted = await db
      .insert(invoices)
      .values({
        businessId: business.id,
        clientId,
        number,
        status: ["draft", "sent", "paid", "overdue", "cancelled"].includes(status) ? status : "draft",
        issueDate,
        dueDate: dueOrExpiryDate,
        currency: business.currency,
        subtotal,
        taxRate,
        taxAmount,
        total,
        amountPaid: status === "paid" ? total : 0,
        notes,
      })
      .returning();
    createdInvoiceId = inserted[0].id;
    await db.insert(invoiceLineItems).values(
      lineItems.map((li, i) => ({
        invoiceId: createdInvoiceId!,
        description: li.description,
        quantity: li.quantity,
        unitPrice: li.unitPrice,
        amount: Math.round(li.quantity * li.unitPrice * 100) / 100,
        sortOrder: i,
      }))
    );
  } else {
    const number = (formData.get("number") as string) || (await nextQuoteNumber(business.id));
    const inserted = await db
      .insert(quotes)
      .values({
        businessId: business.id,
        clientId,
        number,
        status: ["draft", "sent", "accepted", "declined", "expired"].includes(status) ? status : "draft",
        issueDate,
        expiryDate: dueOrExpiryDate,
        currency: business.currency,
        subtotal,
        taxRate,
        taxAmount,
        total,
        notes,
      })
      .returning();
    createdQuoteId = inserted[0].id;
    await db.insert(quoteLineItems).values(
      lineItems.map((li, i) => ({
        quoteId: createdQuoteId!,
        description: li.description,
        quantity: li.quantity,
        unitPrice: li.unitPrice,
        amount: Math.round(li.quantity * li.unitPrice * 100) / 100,
        sortOrder: i,
      }))
    );
  }

  await db
    .update(documentImports)
    .set({
      status: "imported",
      matchedClientId: clientId,
      createdInvoiceId,
      createdQuoteId,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(documentImports.id, importId));

  revalidatePath("/imports");
  revalidatePath("/invoices");
  revalidatePath("/quotes");
  revalidatePath("/clients");
  revalidatePath("/items");

  redirect(createdInvoiceId ? `/invoices/${createdInvoiceId}` : `/quotes/${createdQuoteId}`);
}
