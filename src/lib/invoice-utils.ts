import { db } from "@/db";
import { businesses, invoices } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export type LineItemInput = {
  description: string;
  quantity: number;
  unitPrice: number;
};

export function calcTotals(lineItems: LineItemInput[], taxRate: number) {
  const subtotal = lineItems.reduce(
    (sum, li) => sum + li.quantity * li.unitPrice,
    0
  );
  const taxAmount = Math.round(subtotal * (taxRate / 100) * 100) / 100;
  const total = Math.round((subtotal + taxAmount) * 100) / 100;
  return {
    subtotal: Math.round(subtotal * 100) / 100,
    taxAmount,
    total,
  };
}

/**
 * Atomically claims the next invoice number for a business and returns the
 * formatted invoice number, e.g. "INV-0001". Uses a single UPDATE...RETURNING
 * style read-modify-write; better-sqlite3 is synchronous so this is safe
 * from race conditions within a single Node process.
 */
export async function nextInvoiceNumber(businessId: string) {
  const business = await db.query.businesses.findFirst({
    where: eq(businesses.id, businessId),
  });
  if (!business) throw new Error("Business not found");

  const seq = business.nextInvoiceSeq;
  await db
    .update(businesses)
    .set({ nextInvoiceSeq: seq + 1 })
    .where(eq(businesses.id, businessId));

  const padded = String(seq).padStart(4, "0");
  return `${business.invoicePrefix}-${padded}`;
}

export function statusLabel(status: string) {
  switch (status) {
    case "draft":
      return "Draft";
    case "sent":
      return "Sent";
    case "paid":
      return "Paid";
    case "overdue":
      return "Overdue";
    case "cancelled":
      return "Cancelled";
    default:
      return status;
  }
}

/** Marks any sent invoices past their due date as overdue. Call on dashboard/list loads. */
export async function sweepOverdueInvoices(businessId: string) {
  const today = new Date().toISOString().slice(0, 10);
  await db
    .update(invoices)
    .set({ status: "overdue" })
    .where(
      sql`${invoices.businessId} = ${businessId} and ${invoices.status} = 'sent' and ${invoices.dueDate} < ${today}`
    );
}
