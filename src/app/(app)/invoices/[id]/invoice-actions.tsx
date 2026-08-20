"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { sendInvoice, deleteInvoice, markInvoicePaid } from "@/lib/actions/invoices";
import { PdfPreviewButton } from "../../pdf-preview-button";

export function InvoiceActions({
  invoiceId,
  invoiceNumber,
  status,
  hasClientEmail,
}: {
  invoiceId: string;
  invoiceNumber: string;
  status: string;
  hasClientEmail: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <div className="flex flex-wrap gap-2">
      <PdfPreviewButton href={`/invoices/${invoiceId}/pdf`} filename={`${invoiceNumber}.pdf`} label="Preview" />

      <Link
        href={`/invoices/${invoiceId}/edit`}
        className="px-3 py-1.5 rounded-md text-sm border border-gray-300 hover:bg-gray-100"
      >
        Edit
      </Link>

      {status !== "paid" && status !== "cancelled" && (
        <button
          disabled={pending || !hasClientEmail}
          title={!hasClientEmail ? "Client has no email on file" : undefined}
          onClick={() =>
            startTransition(async () => {
              await sendInvoice(invoiceId);
              router.refresh();
            })
          }
          className="px-3 py-1.5 rounded-md text-sm border border-gray-300 hover:bg-gray-100 disabled:opacity-50"
        >
          {status === "draft" ? "Send invoice" : "Resend invoice"}
        </button>
      )}

      {status !== "paid" && status !== "cancelled" && (
        <button
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await markInvoicePaid(invoiceId);
              router.refresh();
            })
          }
          className="px-3 py-1.5 rounded-md text-sm bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
        >
          Mark as paid
        </button>
      )}

      <button
        disabled={pending}
        onClick={() => {
          if (confirm("Delete this invoice? This cannot be undone.")) {
            startTransition(() => deleteInvoice(invoiceId));
          }
        }}
        className="px-3 py-1.5 rounded-md text-sm text-red-600 border border-red-200 hover:bg-red-50 disabled:opacity-50"
      >
        Delete
      </button>
    </div>
  );
}
