"use client";

import { useActionState, useEffect, useState } from "react";
import { submitSupportTicket, type SupportState } from "@/lib/actions/support";

const initialState: SupportState = {};

export function SupportForm() {
  const [state, formAction, pending] = useActionState(submitSupportTicket, initialState);
  const [pageUrl, setPageUrl] = useState("");

  useEffect(() => {
    setPageUrl(window.location.href);
  }, []);

  if (state.success) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
        <p className="font-medium text-green-900">Thanks — we&apos;ve got it.</p>
        <p className="text-sm text-green-800 mt-1">
          Your report has been sent. We review every report ourselves before making any changes, so
          nothing about your account or data changes automatically because of this.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      {state.error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {state.error}
        </p>
      )}
      <input type="hidden" name="pageUrl" value={pageUrl} />
      <div>
        <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
          What&apos;s going wrong?
        </label>
        <textarea
          id="message"
          name="message"
          required
          rows={6}
          placeholder="Tell us what you were trying to do, what happened instead, and which invoice/quote/client it involved if relevant."
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="bg-gray-900 text-white rounded-md px-4 py-2.5 font-medium hover:bg-gray-800 disabled:opacity-60"
      >
        {pending ? "Sending…" : "Send report"}
      </button>
    </form>
  );
}
