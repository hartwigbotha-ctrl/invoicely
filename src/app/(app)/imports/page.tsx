import Link from "next/link";
import { requireBusiness } from "@/lib/session";
import { db } from "@/db";
import { documentImports } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { hasProAccess } from "@/lib/plan-access";
import { uploadAndParseDocuments, discardImport } from "@/lib/actions/imports";
import { UploadForm } from "./upload-form";
import { Lock } from "lucide-react";

export default async function ImportsPage() {
  const { business } = await requireBusiness();
  const entitled = await hasProAccess(business.id);

  if (!entitled) {
    return (
      <div className="p-4 sm:p-8 max-w-2xl mx-auto text-center">
        <div className="bg-white border border-gray-200 rounded-lg p-10">
          <Lock size={28} className="mx-auto text-gray-400 mb-4" />
          <h1 className="text-xl font-bold mb-2">Import old invoices &amp; quotes</h1>
          <p className="text-gray-600 mb-6">
            Upload your old Excel sheets, Word docs, PDFs or scanned invoices and Voxbil will
            automatically read them, detect clients and items, and convert them into proper
            invoices/quotes — no retyping. This is a Pro/Business feature.
          </p>
          <Link
            href="/settings"
            className="bg-gray-900 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-800"
          >
            Upgrade your plan
          </Link>
        </div>
      </div>
    );
  }

  const pendingImports = await db.query.documentImports.findMany({
    where: eq(documentImports.businessId, business.id),
    orderBy: desc(documentImports.createdAt),
    with: { matchedClient: true },
  });

  return (
    <div className="p-4 sm:p-8 max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Import old invoices &amp; quotes</h1>
        <p className="text-sm text-gray-600 mt-1">
          Upload your old paperwork — Voxbil detects the client, items and totals
          automatically. Review and edit before anything is created.
        </p>
      </div>

      <UploadForm action={uploadAndParseDocuments} />

      {pendingImports.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-100">
          {pendingImports.map((imp) => {
            let preview: { client?: { name?: string | null }; total?: number | null } = {};
            try {
              preview = JSON.parse(imp.extractedJson);
            } catch {
              // ignore
            }
            return (
              <div key={imp.id} className="flex items-center justify-between p-4 gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{imp.fileName}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {imp.status === "failed"
                      ? imp.errorMessage || "Couldn't read this file"
                      : `${imp.docType === "quote" ? "Quote" : "Invoice"} · ${
                          imp.matchedClient?.name || preview.client?.name || "Unknown client"
                        }${preview.total ? ` · ${business.currency} ${preview.total.toFixed(2)}` : ""}`}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span
                    className={`text-xs px-2 py-1 rounded-full font-medium ${
                      imp.status === "imported"
                        ? "bg-green-100 text-green-700"
                        : imp.status === "failed"
                        ? "bg-red-100 text-red-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {imp.status}
                  </span>
                  {imp.status === "pending" && (
                    <Link
                      href={`/imports/${imp.id}`}
                      className="text-sm text-gray-700 hover:text-gray-900 underline"
                    >
                      Review
                    </Link>
                  )}
                  {imp.status !== "imported" && (
                    <form action={discardImport.bind(null, imp.id)}>
                      <button type="submit" className="text-sm text-gray-400 hover:text-red-600">
                        Discard
                      </button>
                    </form>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
