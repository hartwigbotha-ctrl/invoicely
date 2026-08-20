"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  sendQuote,
  deleteQuote,
  markQuoteResponded,
  convertQuoteToInvoice,
} from "@/lib/actions/quotes";
import { PdfPreviewButton } from "../../pdf-preview-button";

export function QuoteActions({
  quoteId,
  quoteNumber,
  status,
  hasClientEmail,
  alreadyConverted,
}: {
  quoteId: string;
  quoteNumber: string;
  status: string;
  hasClientEmail: boolean;
  alreadyConverted: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <div className="flex flex-wrap gap-2">
      <PdfPreviewButton href={`/quotes/${quoteId}/pdf`} filename={`${quoteNumber}.pdf`} label="Preview" />

      <Link
        href={`/quotes/${quoteId}/edit`}
        className="px-3 py-1.5 rounded-md text-sm border border-gray-300 hover:bg-gray-100"
      >
        Edit
      </Link>

      {status !== "accepted" && status !== "declined" && (
        <button
          disabled={pending || !hasClientEmail}
          title={!hasClientEmail ? "Client has no email on file" : undefined}
          onClick={() =>
            startTransition(async () => {
              await sendQuote(quoteId);
              router.refresh();
            })
          }
          className="px-3 py-1.5 rounded-md text-sm border border-gray-300 hover:bg-gray-100 disabled:opacity-50"
        >
          {status === "draft" ? "Send quote" : "Resend quote"}
        </button>
      )}

      {status === "sent" && (
        <>
          <button
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                await markQuoteResponded(quoteId, true);
                router.refresh();
              })
            }
            className="px-3 py-1.5 rounded-md text-sm bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
          >
            Mark accepted
          </button>
          <button
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                await markQuoteResponded(quoteId, false);
                router.refresh();
              })
            }
            className="px-3 py-1.5 rounded-md text-sm border border-gray-300 text-gray-700 hover:bg-gray-100 disabled:opacity-50"
          >
            Mark declined
          </button>
        </>
      )}

      {!alreadyConverted && (
        <button
          disabled={pending}
          onClick={() => {
            if (confirm(`Create a draft invoice from ${quoteNumber}?`)) {
              startTransition(() => convertQuoteToInvoice(quoteId));
            }
          }}
          className="px-3 py-1.5 rounded-md text-sm bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-50"
        >
          Convert to invoice
        </button>
      )}

      <button
        disabled={pending}
        onClick={() => {
          if (confirm("Delete this quote? This cannot be undone.")) {
            startTransition(() => deleteQuote(quoteId));
          }
        }}
        className="px-3 py-1.5 rounded-md text-sm text-red-600 border border-red-200 hover:bg-red-50 disabled:opacity-50"
      >
        Delete
      </button>
    </div>
  );
}
