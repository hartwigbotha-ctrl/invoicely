import Link from "next/link";

export default function BillingCancelPage() {
  return (
    <div className="p-4 sm:p-8 max-w-lg mx-auto text-center space-y-4">
      <h1 className="text-2xl font-bold">Checkout cancelled</h1>
      <p className="text-sm text-gray-600">
        No payment was made. You can pick a plan and try again whenever you&apos;re ready.
      </p>
      <Link
        href="/billing/subscribe"
        className="inline-block bg-gray-900 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-gray-800"
      >
        Choose a plan
      </Link>
    </div>
  );
}
