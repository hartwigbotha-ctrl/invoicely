"use client";

import { deleteClient } from "@/lib/actions/clients";

export function DeleteClientButton({ clientId }: { clientId: string }) {
  return (
    <button
      onClick={() => {
        if (confirm("Delete this client? This cannot be undone.")) {
          deleteClient(clientId);
        }
      }}
      className="text-xs text-red-600 hover:underline"
    >
      Delete
    </button>
  );
}
