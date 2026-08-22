"use client";

import { useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import type { PlanDefinition } from "@/lib/plans";

/**
 * Interactive pricing cards: clicking a card selects it (moves the
 * highlight), rather than Pro always being visually "chosen" no matter what
 * you click. Registration itself doesn't collect a plan yet — the actual
 * plan is set from Settings after signing up — so selecting a card here is
 * just a clearer way to compare plans before clicking through; the ?plan=
 * query param on the link is a hint the register page can use later.
 */
export function PricingCards({ plans }: { plans: PlanDefinition[] }) {
  const [selected, setSelected] = useState(
    () => plans.find((p) => p.name === "Pro")?.name ?? plans[0].name
  );

  return (
    <div className="grid sm:grid-cols-3 gap-6">
      {plans.map((plan) => {
        const isSelected = plan.name === selected;
        return (
          <button
            key={plan.name}
            type="button"
            onClick={() => setSelected(plan.name)}
            className={`relative text-left rounded-2xl border p-6 flex flex-col transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
              isSelected
                ? "bg-gray-900 border-gray-900 text-white shadow-xl shadow-indigo-900/10 sm:-translate-y-2"
                : "bg-white border-gray-200 hover:border-gray-300"
            }`}
          >
            {plan.name === "Pro" && (
              <span
                className={`self-start mb-3 text-xs font-semibold px-2.5 py-1 rounded-full ${
                  isSelected
                    ? "bg-gradient-to-r from-indigo-500 to-fuchsia-500 text-white"
                    : "bg-indigo-50 text-indigo-700"
                }`}
              >
                Most popular
              </span>
            )}
            <h3 className="text-lg font-bold">{plan.name}</h3>
            <p className="mt-2">
              <span className="text-3xl font-extrabold">R{plan.priceMonthly}</span>
              <span className={isSelected ? "text-gray-300 text-sm" : "text-gray-500 text-sm"}> /month</span>
            </p>
            <ul className={`mt-6 space-y-2.5 text-sm flex-1 ${isSelected ? "text-gray-200" : "text-gray-700"}`}>
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <Check
                    size={16}
                    className={`shrink-0 mt-0.5 ${isSelected ? "text-fuchsia-400" : "text-indigo-600"}`}
                  />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <Link
              href={`/register?plan=${encodeURIComponent(plan.name)}`}
              onClick={(e) => e.stopPropagation()}
              className={`mt-6 text-center px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                isSelected
                  ? "bg-white text-gray-900 hover:bg-gray-100"
                  : "border border-gray-300 hover:bg-gray-100"
              }`}
            >
              Choose {plan.name}
            </Link>
          </button>
        );
      })}
    </div>
  );
}
