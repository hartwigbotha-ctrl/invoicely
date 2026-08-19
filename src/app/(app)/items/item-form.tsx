import type { items } from "@/db/schema";

type Item = typeof items.$inferSelect;

export function ItemForm({
  action,
  item,
}: {
  action: (formData: FormData) => void;
  item?: Item;
}) {
  return (
    <form action={action} className="space-y-4 max-w-lg">
      <Field name="code" label="Code (optional, e.g. a category or SKU)" defaultValue={item?.code ?? ""} />
      <Field name="name" label="Item / service name" defaultValue={item?.name} required />
      <Field
        name="defaultPrice"
        label="Default price"
        type="number"
        defaultValue={item ? String(item.defaultPrice) : "0"}
      />

      <button
        type="submit"
        className="bg-gray-900 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-800"
      >
        {item ? "Save changes" : "Add item"}
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
}: {
  name: string;
  label: string;
  type?: string;
  defaultValue?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        step={type === "number" ? "any" : undefined}
        defaultValue={defaultValue}
        required={required}
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
      />
    </div>
  );
}
