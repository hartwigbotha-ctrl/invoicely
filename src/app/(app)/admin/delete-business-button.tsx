"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { deleteBusinessAction } from "@/lib/actions/admin";

export function DeleteBusinessButton({
  businessId,
  businessName,
}: {
  businessId: string;
  businessName: string;
}) {
  const [open, setOpen] = useState(false);
  const [confirmName, setConfirmName] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs text-red-600 hover:underline"
      >
        Delete
      </button>
    );
  }

  const matches = confirmName.trim() === businessName.trim();

  return (
    <div className="text-left space-y-1 min-w-[180px]">
      <p className="text-xs text-gray-600">
        Type <span className="font-semibold">{businessName}</span> to permanently
        delete this business and all its data.
      </p>
      <input
        type="text"
        value={confirmName}
        onChange={(e) => setConfirmName(e.target.value)}
        placeholder={businessName}
        disabled={pending}
        className="w-full text-xs border border-gray-300 rounded px-2 py-1"
        autoFocus
      />
      <div className="flex gap-2">
        <button
          type="button"
          disabled={!matches || pending}
          onClick={() => {
            startTransition(async () => {
              setError(null);
              const result = await deleteBusinessAction(businessId, confirmName);
              if (!result.ok) {
                setError(result.error);
                toast.error(result.error);
                return;
              }
              toast.success(`${businessName} deleted`);
              setOpen(false);
              setConfirmName("");
              router.refresh();
            });
          }}
          className="text-xs px-2 py-1 rounded bg-red-600 text-white disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {pending ? "Deleting…" : "Confirm delete"}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            setOpen(false);
            setConfirmName("");
            setError(null);
          }}
          className="text-xs px-2 py-1 rounded border border-gray-300"
        >
          Cancel
        </button>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
