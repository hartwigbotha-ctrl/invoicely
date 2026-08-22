import Link from "next/link";

/**
 * Shown at the top of a page when a create action redirected back here
 * because the business hit its plan's monthly invoice/quote limit. Reads
 * plain values (not the Error object) since Next.js strips messages off
 * errors thrown in Server Actions in production — passing the details via
 * a redirect query string is what actually gets a real message in front
 * of the user.
 */
export function LimitBanner({ limit, planName }: { limit: string; planName: string }) {
  return (
    <div className="mb-6 bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-900">
      <p className="font-medium">You&apos;ve reached your {planName} plan&apos;s limit</p>
      <p className="mt-1">
        {planName} includes {limit} invoices &amp; quotes per month, combined. Upgrade to Pro or
        Business for unlimited invoices and quotes.
      </p>
      <Link
        href="/settings"
        className="inline-block mt-3 bg-gray-900 text-white px-3 py-1.5 rounded-md text-sm font-medium hover:bg-gray-800"
      >
        Upgrade in Settings
      </Link>
    </div>
  );
}
