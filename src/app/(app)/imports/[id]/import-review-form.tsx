"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { LineItemsEditor, type Row, type SavedItem } from "../../line-items-editor";

type ClientOption = { id: string; name: string };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="bg-gray-900 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
    >
      {pending ? "Importing…" : "Confirm & import"}
    </button>
  );
}

export function ImportReviewForm({
  action,
  allClients,
  savedItems,
  matchedClientId,
  defaultValues,
}: {
  action: (formData: FormData) => void;
  allClients: ClientOption[];
  savedItems: SavedItem[];
  matchedClientId: string | null;
  defaultValues: {
    docType: "invoice" | "quote";
    number: string;
    issueDate: string;
    dueOrExpiryDate: string;
    taxRate: number;
    notes: string;
    clientName: string;
    clientEmail: string;
    clientPhone: string;
    clientAddress: string;
    lineItems: Row[];
  };
}) {
  const [useExistingClient, setUseExistingClient] = useState(!!matchedClientId);
  const [docType, setDocType] = useState<"invoice" | "quote">(defaultValues.docType);

  return (
    <form action={action} className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
        <h2 className="font-semibold">Document</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              name="docType"
              value={docType}
              onChange={(e) => setDocType(e.target.value as "invoice" | "quote")}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            >
              <option value="invoice">Invoice</option>
              <option value="quote">Quote</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Number</label>
            <input
              name="number"
              defaultValue={defaultValues.number}
              placeholder="Leave blank to auto-number"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Issue date</label>
            <input
              type="date"
              name="issueDate"
              defaultValue={defaultValues.issueDate}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {docType === "quote" ? "Valid until" : "Due date"}
            </label>
            <input
              type="date"
              name="dueOrExpiryDate"
              defaultValue={defaultValues.dueOrExpiryDate}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              name="status"
              defaultValue="draft"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            >
              {docType === "invoice" ? (
                <>
                  <option value="draft">Draft</option>
                  <option value="sent">Sent</option>
                  <option value="paid">Paid</option>
                  <option value="overdue">Overdue</option>
                  <option value="cancelled">Cancelled</option>
                </>
              ) : (
                <>
                  <option value="draft">Draft</option>
                  <option value="sent">Sent</option>
                  <option value="accepted">Accepted</option>
                  <option value="declined">Declined</option>
                  <option value="expired">Expired</option>
                </>
              )}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tax rate (%)</label>
            <input
              type="number"
              step="any"
              name="taxRate"
              defaultValue={defaultValues.taxRate}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
        <h2 className="font-semibold">Client</h2>

        {allClients.length > 0 && (
          <label className="flex items-center gap-2 text-sm mb-2">
            <input
              type="checkbox"
              checked={useExistingClient}
              onChange={(e) => setUseExistingClient(e.target.checked)}
            />
            Use an existing client
          </label>
        )}

        {useExistingClient ? (
          <select
            name="clientId"
            defaultValue={matchedClientId ?? ""}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          >
            <option value="" disabled>
              Select a client…
            </option>
            {allClients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        ) : (
          <>
            <input type="hidden" name="clientId" value="__new__" />
            <p className="text-xs text-gray-500">
              No confident match found — a new client will be created from these details (editable):
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Client name</label>
                <input
                  name="clientName"
                  defaultValue={defaultValues.clientName}
                  required
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  name="clientEmail"
                  type="email"
                  defaultValue={defaultValues.clientEmail}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  name="clientPhone"
                  defaultValue={defaultValues.clientPhone}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <input
                  name="clientAddress"
                  defaultValue={defaultValues.clientAddress}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>
            </div>
          </>
        )}
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="font-semibold mb-4">Items</h2>
        <p className="text-xs text-gray-500 mb-3">
          Detected from the document — edit anything that's wrong. New items are added to your
          saved items catalog automatically.
        </p>
        <LineItemsEditor initialRows={defaultValues.lineItems} savedItems={savedItems} />
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
        <textarea
          name="notes"
          defaultValue={defaultValues.notes}
          rows={3}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
        />
      </div>

      <SubmitButton />
    </form>
  );
}
