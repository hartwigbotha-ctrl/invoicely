"use client";

import { LineItemsEditor, type SavedItem, type Row } from "../line-items-editor";

type ClientOption = { id: string; name: string };

export function QuoteForm({
  action,
  allClients,
  savedItems,
  submitLabel,
  defaultValues,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  action: any;
  allClients: ClientOption[];
  savedItems: SavedItem[];
  submitLabel: string;
  defaultValues: {
    clientId?: string;
    taxRate: number;
    issueDate: string;
    expiryDate: string;
    notes?: string | null;
    lineItems?: Row[];
  };
}) {
  return (
    <form action={action} className="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Client</label>
          <select
            name="clientId"
            required
            defaultValue={defaultValues.clientId}
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
          <label className="block text-sm font-medium text-gray-700 mb-1">Tax rate (%)</label>
          <input
            name="taxRate"
            type="number"
            step="any"
            defaultValue={defaultValues.taxRate}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Issue date</label>
          <input
            name="issueDate"
            type="date"
            defaultValue={defaultValues.issueDate}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Valid until</label>
          <input
            name="expiryDate"
            type="date"
            defaultValue={defaultValues.expiryDate}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Line items</label>
        <LineItemsEditor savedItems={savedItems} initialRows={defaultValues.lineItems} />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
        <textarea
          name="notes"
          rows={2}
          defaultValue={defaultValues.notes || ""}
          placeholder="Optional notes for the client"
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
        />
      </div>

      <button
        type="submit"
        className="bg-gray-900 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-800"
      >
        {submitLabel}
      </button>
    </form>
  );
}
