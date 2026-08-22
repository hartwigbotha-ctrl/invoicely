"use client";

/**
 * Generic fallback for any unexpected error thrown inside the (app) route
 * group. Next.js strips the actual message off errors thrown in Server
 * Actions/Server Components in production builds, so this can only ever
 * show a generic message — it's a safety net, not how user-facing errors
 * (like the monthly invoice/quote limit) are communicated. Those redirect
 * back to the page with details in the query string instead; see
 * checkMonthlyDocumentLimit in src/lib/plan-access.ts and <LimitBanner>.
 */
export default function AppError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="p-4 sm:p-8 max-w-lg mx-auto">
      <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
        <h1 className="text-lg font-semibold text-gray-900">Something went wrong</h1>
        <p className="text-sm text-gray-600 mt-2">
          Please try again. If this keeps happening, let us know what you were doing.
        </p>
        <button
          onClick={() => reset()}
          className="mt-4 bg-gray-900 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-800"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
