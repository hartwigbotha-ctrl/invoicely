import Link from "next/link";

// The page PayFast sends the browser back to after checkout. This is
// purely informational — activation actually happens server-to-server via
// the PayFast ITN webhook (see /api/webhooks/payfast), which can land a
// few seconds before or after the browser gets here. If it hasn't landed
// yet, the (app) layout will just bounce back to /billing/subscribe on the
// next click until it has — nothing here needs to poll or guess.
export default function BillingSuccessPage() {
  return (
    <div className="p-4 sm:p-8 max-w-lg mx-auto text-center space-y-4">
      <div className="text-4xl">✓</div>
      <h1 className="text-2xl font-bold">Thanks — almost done</h1>
      <p className="text-sm text-gray-600">
        PayFast is confirming your payment. This usually only takes a few seconds. If your dashboard doesn&apos;t
        unlock right away, wait a moment and try again.
      </p>
      <Link
        href="/dashboard"
        className="inline-block bg-gray-900 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-gray-800"
      >
        Go to dashboard
      </Link>
    </div>
  );
}
