import { requireBusiness } from "@/lib/session";
import { db } from "@/db";
import { clients, items } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { createInvoice } from "@/lib/actions/invoices";
import { LineItemsEditor } from "../../line-items-editor";
import { formatISO, addDays } from "date-fns";
import Link from "next/link";

export default async function NewInvoicePage() {
  const { business } = await requireBusiness();
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
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-8">New invoice</h1>
      <form action={createInvoice} className="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Client</label>
            <select
              name="clientId"
              required
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            >
              {allClients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tax rate (%)
            </label>
            <input
              name="taxRate"
              type="number"
              step="any"
              defaultValue={business.defaultTaxRate}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Issue date</label>
            <input
              name="issueDate"
              type="date"
              defaultValue={today}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Due date</label>
            <input
              name="dueDate"
              type="date"
              defaultValue={defaultDue}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Line items</label>
          <LineItemsEditor savedItems={savedItems} />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea
            name="notes"
            rows={2}
            placeholder="Optional notes for the client"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
        </div>

        <button
          type="submit"
          className="bg-gray-900 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-800"
        >
          Create invoice
        </button>
      </form>
    </div>
  );
}
