import { notFound } from "next/navigation";
import { requireBusiness } from "@/lib/session";
import { db } from "@/db";
import { documentImports, clients, items } from "@/db/schema";
import { and, eq, desc } from "drizzle-orm";
import { hasProAccess } from "@/lib/plan-access";
import { confirmImport } from "@/lib/actions/imports";
import { ImportReviewForm } from "./import-review-form";
import { LimitBanner } from "../../limit-banner";
import type { ExtractedDocument } from "@/lib/document-extract";
import { formatISO } from "date-fns";

export default async function ReviewImportPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ limitReached?: string; plan?: string }>;
}) {
  const { id } = await params;
  const { limitReached, plan } = await searchParams;
  const { business } = await requireBusiness();

  const entitled = await hasProAccess(business.id);
  if (!entitled) notFound();

  const record = await db.query.documentImports.findFirst({
    where: and(eq(documentImports.id, id), eq(documentImports.businessId, business.id)),
  });
  if (!record) notFound();

  const [allClients, savedItems] = await Promise.all([
    db.query.clients.findMany({ where: eq(clients.businessId, business.id) }),
    db.query.items.findMany({ where: eq(items.businessId, business.id), orderBy: desc(items.createdAt) }),
  ]);

  let extracted: ExtractedDocument;
  try {
    extracted = JSON.parse(record.extractedJson);
  } catch {
    extracted = {
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

  const today = formatISO(new Date(), { representation: "date" });

  return (
    <div className="p-4 sm:p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-1">Review import</h1>
      <p className="text-sm text-gray-600 mb-8 truncate">From: {record.fileName}</p>

      {limitReached && <LimitBanner limit={limitReached} planName={plan ?? "Starter"} />}

      <ImportReviewForm
        action={confirmImport.bind(null, record.id)}
        allClients={allClients.map((c) => ({ id: c.id, name: c.name }))}
        savedItems={savedItems}
        matchedClientId={record.matchedClientId}
        defaultValues={{
          docType: extracted.docType,
          number: extracted.documentNumber ?? "",
          issueDate: extracted.issueDate ?? today,
          dueOrExpiryDate: extracted.dueOrExpiryDate ?? today,
          taxRate: business.defaultTaxRate,
          notes: "",
          clientName: extracted.client.name ?? "",
          clientEmail: extracted.client.email ?? "",
          clientPhone: extracted.client.phone ?? "",
          clientAddress: extracted.client.address ?? "",
          lineItems:
            extracted.lineItems.length > 0
              ? extracted.lineItems.map((li) => ({
                  description: li.description,
                  quantity: String(li.quantity ?? 1),
                  unitPrice: String(li.unitPrice ?? li.amount ?? 0),
                }))
              : [{ description: "", quantity: "1", unitPrice: "" }],
        }}
      />
    </div>
  );
}
