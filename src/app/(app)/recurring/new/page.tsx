import { requireBusiness } from "@/lib/session";
import { db } from "@/db";
import { clients, items } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { createRecurringSchedule } from "@/lib/actions/recurring";
import { LineItemsEditor } from "../../line-items-editor";
import { formatISO } from "date-fns";
import Link from "next/link";

export default async function NewSchedulePage() {
  const { business } = await requireBusiness();
  const allClients = await db.query.clients.findMany({
    where: eq(clients.businessId, business.id),
  });
  const savedItems = await db.query.items.findMany({
    where: eq(items.businessId, business.id),
    orderBy: desc(items.createdAt),
  });

  const today = formatISO(new Date(), { representation: "date" });

  if (allClients.length === 0) {
    return (
      <div className="p-4 sm:p-8 max-w-2xl mx-auto text-center">
        <h1 className="text-2xl font-bold mb-4">New recurring schedule</h1>
        <p className="text-gray-600 mb-6">You need at least one client first.</p>
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
      <h1 className="text-2xl font-bold mb-2">New recurring schedule</h1>
      <p className="text-sm text-gray-600 mb-8">
        Voxbil will automatically generate (and optionally email) an invoice each time this schedule is due.
      </p>
      <form action={createRecurringSchedule} className="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              name="title"
              required
              placeholder="Monthly retainer"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
            <select
              name="frequency"
              defaultValue="monthly"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            >
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="annually">Annually</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Every</label>
            <input
              name="intervalCount"
              type="number"
              min="1"
              defaultValue="1"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start date</label>
            <input
              name="startDate"
              type="date"
              defaultValue={today}
              required
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End date (optional)
            </label>
            <input
              name="endDate"
              type="date"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tax rate (%) — leave blank to use business default
            </label>
            <input
              name="taxRate"
              type="number"
              step="any"
              defaultValue={business.defaultTaxRate}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>
          <div className="flex items-center gap-2 mt-6">
            <input id="autoSend" name="autoSend" type="checkbox" defaultChecked className="h-4 w-4" />
            <label htmlFor="autoSend" className="text-sm text-gray-700">
              Automatically email the invoice to the client when generated
            </label>
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
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
        </div>

        <button
          type="submit"
          className="bg-gray-900 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-800"
        >
          Create schedule
        </button>
      </form>
    </div>
  );
}
