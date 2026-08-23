import { requireBusiness } from "@/lib/session";
import { db } from "@/db";
import { subscriptions } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { startSubscriptionCheckout } from "@/lib/actions/billing";

export default async function SubscribePage() {
  const { business } = await requireBusiness();

  const [allPlans, subscription] = await Promise.all([
    db.query.plans.findMany(),
    db.query.subscriptions.findFirst({
      where: eq(subscriptions.businessId, business.id),
      orderBy: desc(subscriptions.createdAt),
      with: { plan: true },
    }),
  ]);

  const blocked = !subscription || subscription.status !== "active";

  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          {subscription?.plan ? "Change your plan" : "Choose a plan to get started"}
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          {blocked
            ? "Nimblo needs an active subscription before you can create invoices and quotes. Pick a plan below to continue — you'll be sent to PayFast to complete payment securely."
            : "Pick a different plan below. Your current plan stays active until the new one is confirmed."}
        </p>
      </div>

      {subscription?.status === "past_due" && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-md px-4 py-3">
          Your last payment didn&apos;t go through. Resubscribe below to restore access.
        </div>
      )}
      {subscription?.status === "canceled" && (
        <div className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-md px-4 py-3">
          Your subscription was cancelled. Choose a plan below to reactivate.
        </div>
      )}
      {subscription?.status === "incomplete" && (
        <div className="bg-blue-50 border border-blue-200 text-blue-800 text-sm rounded-md px-4 py-3">
          Checkout was started but not completed. Pick a plan below to try again.
        </div>
      )}

      <div className="grid sm:grid-cols-3 gap-4">
        {allPlans
          .sort((a, b) => a.priceMonthly - b.priceMonthly)
          .map((plan) => {
            const features: string[] = JSON.parse(plan.features || "[]");
            const isCurrent = subscription?.status === "active" && subscription.plan.id === plan.id;
            return (
              <div
                key={plan.id}
                className={`rounded-lg border p-5 flex flex-col ${
                  isCurrent ? "border-gray-900 ring-1 ring-gray-900" : "border-gray-200"
                }`}
              >
                <h2 className="font-semibold text-lg">{plan.name}</h2>
                <p className="text-2xl font-bold mt-1">
                  {plan.currency} {plan.priceMonthly.toFixed(0)}
                  <span className="text-sm font-normal text-gray-500"> / month</span>
                </p>
                <ul className="mt-4 space-y-2 text-sm text-gray-600 flex-1">
                  {features.map((f) => (
                    <li key={f} className="flex gap-2">
                      <span className="text-green-600">✓</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                {isCurrent ? (
                  <p className="mt-4 text-center text-sm font-medium text-gray-500 py-2">Current plan</p>
                ) : (
                  <form action={startSubscriptionCheckout} className="mt-4">
                    <input type="hidden" name="planName" value={plan.name} />
                    <button
                      type="submit"
                      className="w-full bg-gray-900 text-white rounded-md py-2 text-sm font-medium hover:bg-gray-800"
                    >
                      {subscription?.status === "active" ? "Switch to this plan" : "Subscribe"}
                    </button>
                  </form>
                )}
              </div>
            );
          })}
      </div>

      <p className="text-xs text-gray-400">
        Payments are processed securely by PayFast. You&apos;ll be redirected to complete checkout, then brought back
        here.
      </p>
    </div>
  );
}
