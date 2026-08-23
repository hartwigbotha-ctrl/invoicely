"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cancelSubscription } from "@/lib/actions/billing";

export function CancelSubscriptionButton() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  return (
    <div className="mt-2">
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (!confirm("Cancel your Voxbil subscription? You'll lose access once the current billing period ends.")) {
            return;
          }
          startTransition(async () => {
            setError(null);
            const result = await cancelSubscription();
            if (!result.ok) {
              setError(result.error);
              return;
            }
            router.refresh();
          });
        }}
        className="text-xs text-red-600 hover:underline disabled:opacity-50"
      >
        {pending ? "Cancelling…" : "Cancel subscription"}
      </button>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
