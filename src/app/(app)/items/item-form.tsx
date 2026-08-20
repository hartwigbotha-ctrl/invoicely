"use client";

import { useState } from "react";
import type { items } from "@/db/schema";

type Item = typeof items.$inferSelect;

const UNIT_TYPES = ["None", "Hours", "Days", "Units", "Meters", "Kilometers", "Sessions"];

export function ItemForm({
  action,
  item,
}: {
  action: (formData: FormData) => void;
  item?: Item;
}) {
  const [taxable, setTaxable] = useState(item ? item.taxable : true);

  return (
    <form action={action} className="space-y-5 max-w-lg">
      <Field name="code" label="Item code" placeholder="Enter a code…" defaultValue={item?.code ?? ""} />
      <Field
        name="name"
        label="Item name"
        placeholder="Enter item name…"
        defaultValue={item?.name}
        required
      />
      <Field
        name="description"
        label="Description"
        placeholder="Enter a description…"
        defaultValue={item?.description ?? ""}
        textarea
      />

      <div className="grid grid-cols-2 gap-4">
        <Field
          name="defaultPrice"
          label="Rate"
          type="number"
          defaultValue={item ? String(item.defaultPrice) : "0"}
        />
        <Field name="cost" label="Cost" type="number" defaultValue={item ? String(item.cost) : "0"} />
      </div>

      <div>
        <label htmlFor="unitType" className="block text-sm font-medium text-gray-700 mb-1">
          Unit type
        </label>
        <select
          id="unitType"
          name="unitType"
          defaultValue={item?.unitType ?? "None"}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
        >
          {UNIT_TYPES.map((u) => (
            <option key={u} value={u}>
              {u}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-start justify-between border border-gray-200 rounded-md px-4 py-3">
        <div>
          <p className="text-sm font-medium text-gray-900">Enable taxes</p>
          <p className="text-xs text-gray-500 mt-0.5">Default taxes will be applied to this item.</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={taxable}
          onClick={() => setTaxable((v) => !v)}
          className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
            taxable ? "bg-gray-900" : "bg-gray-300"
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              taxable ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
        <input type="checkbox" name="taxable" checked={taxable} readOnly className="hidden" />
      </div>

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
          step={type === "number" ? "any" : undefined}
          placeholder={placeholder}
          defaultValue={defaultValue}
          required={required}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
        />
      )}
    </div>
  );
}
