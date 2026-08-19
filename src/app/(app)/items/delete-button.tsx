"use client";

import { deleteItem } from "@/lib/actions/items";

export function DeleteItemButton({ itemId }: { itemId: string }) {
  return (
    <button
      onClick={() => {
        if (confirm("Delete this item? This cannot be undone.")) {
          deleteItem(itemId);
        }
      }}
      className="text-xs text-red-600 hover:underline"
    >
      Delete
    </button>
  );
}
