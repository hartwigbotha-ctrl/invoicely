import type { clients } from "@/db/schema";

type Client = typeof clients.$inferSelect;

export function ClientForm({
  action,
  client,
}: {
  action: (formData: FormData) => void;
  client?: Client;
}) {
  return (
    <form action={action} className="space-y-4 max-w-lg">
      <Field name="name" label="Name" defaultValue={client?.name} required />
      <Field name="email" label="Email" type="email" defaultValue={client?.email ?? ""} />
      <Field name="phone" label="Phone" defaultValue={client?.phone ?? ""} />
      <Field name="address" label="Address" defaultValue={client?.address ?? ""} textarea />
      <Field name="vatNumber" label="VAT number" defaultValue={client?.vatNumber ?? ""} />
      <Field name="notes" label="Notes" defaultValue={client?.notes ?? ""} textarea />

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
  defaultValue,
  required,
  textarea,
}: {
  name: string;
  label: string;
  type?: string;
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
          defaultValue={defaultValue}
          rows={3}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
        />
      ) : (
        <input
          id={name}
          name={name}
          type={type}
          defaultValue={defaultValue}
          required={required}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
        />
      )}
    </div>
  );
}
