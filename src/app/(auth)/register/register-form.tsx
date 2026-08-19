"use client";

import { useActionState } from "react";
import { registerBusiness, type RegisterState } from "@/lib/actions/auth-actions";

const initialState: RegisterState = {};

export function RegisterForm() {
  const [state, formAction, pending] = useActionState(registerBusiness, initialState);

  return (
    <form action={formAction} className="space-y-4">
      {state.error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {state.error}
        </p>
      )}
      <Field name="businessName" label="Business name" placeholder="Acme Plumbing" error={state.fieldErrors?.businessName} />
      <Field name="name" label="Your name" placeholder="Jane Doe" error={state.fieldErrors?.name} />
      <Field name="email" label="Email" type="email" placeholder="you@business.co.za" error={state.fieldErrors?.email} />
      <Field name="password" label="Password" type="password" placeholder="At least 8 characters" error={state.fieldErrors?.password} />

      <button
        type="submit"
        disabled={pending}
        className="w-full bg-gray-900 text-white rounded-md py-2.5 font-medium hover:bg-gray-800 disabled:opacity-60"
      >
        {pending ? "Creating account…" : "Create account"}
      </button>
    </form>
  );
}

function Field({
  name,
  label,
  type = "text",
  placeholder,
  error,
}: {
  name: string;
  label: string;
  type?: string;
  placeholder?: string;
  error?: string;
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
        placeholder={placeholder}
        required
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
