import type { clients } from "@/db/schema";

type Client = typeof clients.$inferSelect;

const PAYMENT_TERMS_OPTIONS = [
  { label: "None (use business default)", value: "" },
  { label: "Due on receipt", value: "0" },
  { label: "Net 7", value: "7" },
  { label: "Net 14", value: "14" },
  { label: "Net 30", value: "30" },
  { label: "Net 60", value: "60" },
];

export function ClientForm({
  action,
  client,
}: {
  action: (formData: FormData) => void;
  client?: Client;
}) {
  return (
    <form action={action} className="space-y-4 max-w-lg">
      <Field name="name" label="Client name" placeholder="Enter a name…" defaultValue={client?.name} required />
      <Field
        name="email"
        label="Email"
        type="email"
        placeholder="Enter an email address…"
        defaultValue={client?.email ?? ""}
      />
      <Field
        name="address"
        label="Billing address"
        placeholder="Enter a billing address…"
        defaultValue={client?.address ?? ""}
        textarea
      />
      <Field
        name="contactName"
        label="Contact name"
        placeholder="Enter contact information…"
        defaultValue={client?.contactName ?? ""}
      />
      <Field
        name="phone"
        label="Phone"
        placeholder="Enter a phone number…"
        defaultValue={client?.phone ?? ""}
      />
      <Field
        name="mobile"
        label="Mobile"
        placeholder="Enter a mobile number…"
        defaultValue={client?.mobile ?? ""}
      />
      <Field name="website" label="Website" placeholder="Enter a URL…" defaultValue={client?.website ?? ""} />
      <Field
        name="vatNumber"
        label="Tax number"
        placeholder="Enter a tax registration number…"
        defaultValue={client?.vatNumber ?? ""}
      />

      <div>
        <label htmlFor="customPaymentTermsDays" className="block text-sm font-medium text-gray-700 mb-1">
          Custom payment terms
        </label>
        <select
          id="customPaymentTermsDays"
          name="customPaymentTermsDays"
          defaultValue={
            client?.customPaymentTermsDays !== null && client?.customPaymentTermsDays !== undefined
              ? String(client.customPaymentTermsDays)
              : ""
          }
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
        >
          {PAYMENT_TERMS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <Field
        name="notes"
        label="Notes"
        placeholder="Enter a private note about this client…"
        defaultValue={client?.notes ?? ""}
        textarea
      />

      <button
        type="submit"
        className="bg-gray-900 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-800"
      >
        {client ? "Save changes" : "Add client"}
      </button>
    </form>
  );
}

function Field({
  name,
  label,
  type = "text",
  placeholder,
  defaultValue,
  required,
  textarea,
}: {
  name: string;
  label: string;
  type?: string;
  placeholder?: string;
  defaultValue?: string;
  required?: boolean;
  textarea?: boolean;
}) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      {textarea ? (
        <textarea
          id={name}
          name={name}
          rows={2}
          placeholder={placeholder}
          defaultValue={defaultValue}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
        />
      ) : (
        <input
          id={name}
          name={name}
          type={type}
          placeholder={placeholder}
          defaultValue={defaultValue}
          required={required}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
        />
      )}
    </div>
  );
}
