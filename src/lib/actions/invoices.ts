"use server";

import { db } from "@/db";
import { invoices, invoiceLineItems, clients, payments } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { requireBusiness } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { calcTotals, nextInvoiceNumber, type LineItemInput } from "@/lib/invoice-utils";
import { generateInvoicePdf } from "@/lib/invoice-pdf";
import { sendInvoiceEmail } from "@/lib/mailer";
import { addDays, formatISO } from "date-fns";

function parseLineItems(formData: FormData): LineItemInput[] {
  const descriptions = formData.getAll("li_description") as string[];
  const quantities = formData.getAll("li_quantity") as string[];
  const unitPrices = formData.getAll("li_unitPrice") as string[];

  const items: LineItemInput[] = [];
  for (let i = 0; i < descriptions.length; i++) {
    const description = descriptions[i]?.trim();
    if (!description) continue;
    items.push({
      description,
      quantity: Number(quantities[i] || 0) || 0,
      unitPrice: Number(unitPrices[i] || 0) || 0,
    });
  }
  if (items.length === 0) {
    throw new Error("At least one line item is required");
  }
  return items;
}

export async function createInvoice(formData: FormData) {
  const { business } = await requireBusiness();

  const clientId = formData.get("clientId") as string;
  const taxRate = Number(formData.get("taxRate") || business.defaultTaxRate);
  const issueDate = (formData.get("issueDate") as string) || formatISO(new Date(), { representation: "date" });
  const dueDate =
    (formData.get("dueDate") as string) ||
    formatISO(addDays(new Date(issueDate), business.paymentTermsDays), { representation: "date" });
  const notes = (formData.get("notes") as string) || null;

  const client = await db.query.clients.findFirst({
    where: and(eq(clients.id, clientId), eq(clients.businessId, business.id)),
  });
  if (!client) throw new Error("Client not found");

  const lineItems = parseLineItems(formData);
  const { subtotal, taxAmount, total } = calcTotals(lineItems, taxRate);
  const number = await nextInvoiceNumber(business.id);

  const inserted = await db
    .insert(invoices)
    .values({
      businessId: business.id,
      clientId,
      number,
      status: "draft",
      issueDate,
      dueDate,
      currency: business.currency,
      subtotal,
      taxRate,
      taxAmount,
      total,
      notes,
    })
    .returning();

  const invoiceId = inserted[0].id;

  await db.insert(invoiceLineItems).values(
    lineItems.map((li, i) => ({
      invoiceId,
      description: li.description,
      quantity: li.quantity,
      unitPrice: li.unitPrice,
      amount: Math.round(li.quantity * li.unitPrice * 100) / 100,
      sortOrder: i,
    }))
  );

  revalidatePath("/invoices");
  redirect(`/invoices/${invoiceId}`);
}

export async function deleteInvoice(invoiceId: string) {
  const { business } = await requireBusiness();
  await db
    .delete(invoices)
    .where(and(eq(invoices.id, invoiceId), eq(invoices.businessId, business.id)));
  revalidatePath("/invoices");
  redirect("/invoices");
}

export async function markInvoicePaid(invoiceId: string, amount?: number) {
  const { business } = await requireBusiness();
  const invoice = await db.query.invoices.findFirst({
    where: and(eq(invoices.id, invoiceId), eq(invoices.businessId, business.id)),
  });
  if (!invoice) throw new Error("Invoice not found");

  const payAmount = amount ?? invoice.total - invoice.amountPaid;
  const now = new Date().toISOString();

  await db.insert(payments).values({
    invoiceId,
    amount: payAmount,
    method: "manual",
    paidAt: now,
  });

  const newAmountPaid = invoice.amountPaid + payAmount;
  const isFullyPaid = newAmountPaid >= invoice.total - 0.001;

  await db
    .update(invoices)
    .set({
      amountPaid: newAmountPaid,
      status: isFullyPaid ? "paid" : invoice.status,
      paidAt: isFullyPaid ? now : invoice.paidAt,
      updatedAt: now,
    })
    .where(eq(invoices.id, invoiceId));

  revalidatePath(`/invoices/${invoiceId}`);
  revalidatePath("/invoices");
}

async function loadFullInvoice(invoiceId: string, businessId: string) {
  const invoice = await db.query.invoices.findFirst({
    where: and(eq(invoices.id, invoiceId), eq(invoices.businessId, businessId)),
    with: { lineItems: true, client: true, business: true },
  });
  if (!invoice) throw new Error("Invoice not found");
  return invoice;
}

export async function buildInvoicePdfBuffer(invoiceId: string, businessId: string) {
  const invoice = await loadFullInvoice(invoiceId, businessId);
  return generateInvoicePdf({
    business: invoice.business,
    client: invoice.client,
    invoice,
    lineItems: invoice.lineItems.sort((a, b) => a.sortOrder - b.sortOrder),
  });
}

export async function sendInvoice(invoiceId: string) {
  const { business } = await requireBusiness();
  const invoice = await loadFullInvoice(invoiceId, business.id);

  if (!invoice.client.email) {
    throw new Error("This client has no email address on file.");
  }

  const pdfBuffer = await generateInvoicePdf({
    business: invoice.business,
    client: invoice.client,
    invoice,
    lineItems: invoice.lineItems.sort((a, b) => a.sortOrder - b.sortOrder),
  });

  await sendInvoiceEmail({
    to: invoice.client.email,
    businessName: invoice.business.name,
    invoiceNumber: invoice.number,
    total: `${invoice.currency} ${invoice.total.toFixed(2)}`,
    dueDate: invoice.dueDate,
    pdfBuffer,
  });

  const now = new Date().toISOString();
  await db
    .update(invoices)
    .set({ status: invoice.status === "draft" ? "sent" : invoice.status, sentAt: now, updatedAt: now })
    .where(eq(invoices.id, invoiceId));

  revalidatePath(`/invoices/${invoiceId}`);
  revalidatePath("/invoices");
}
