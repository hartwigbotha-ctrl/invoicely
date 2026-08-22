import { requireBusiness } from "@/lib/session";
import { db } from "@/db";
import { clients, items } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { createInvoice } from "@/lib/actions/invoices";
import { InvoiceForm } from "../invoice-form";
import { LimitBanner } from "../../limit-banner";
import { formatISO, addDays } from "date-fns";
import Link from "next/link";

export default async function NewInvoicePage({
  searchParams,
}: {
  searchParams: Promise<{ limitReached?: string; plan?: string }>;
}) {
  const { business } = await requireBusiness();
  const { limitReached, plan } = await searchParams;
  const allClients = await db.query.clients.findMany({
    where: eq(clients.businessId, business.id),
  });
  const savedItems = await db.query.items.findMany({
    where: eq(items.businessId, business.id),
    orderBy: desc(items.createdAt),
  });

  const today = formatISO(new Date(), { representation: "date" });
  const defaultDue = formatISO(addDays(new Date(), business.paymentTermsDays), {
    representation: "date",
  });

  if (allClients.length === 0) {
    return (
      <div className="p-8 max-w-2xl mx-auto text-center">
        <h1 className="text-2xl font-bold mb-4">New invoice</h1>
        <p className="text-gray-600 mb-6">You need at least one client before creating an invoice.</p>
        <Link
          href="/clients/new"
          className="bg-gray-900 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-800"
        >
          Add a client
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-8">New invoice</h1>
      {limitReached && <LimitBanner limit={limitReached} planName={plan ?? "Starter"} />}
      <InvoiceForm
        action={createInvoice}
        allClients={allClients}
        savedItems={savedItems}
        submitLabel="Create invoice"
        defaultValues={{
          taxRate: business.defaultTaxRate,
          issueDate: today,
          dueDate: defaultDue,
        }}
      />
    </div>
  );
}
