// Single source of truth for Invoicely's own subscription plans (what
// contractors pay YOU to use the app — separate from the invoices they
// send their own clients). Update prices/features here; the DB row for
// each plan is kept in sync automatically on every server start
// (see src/instrumentation.ts).

export type PlanDefinition = {
  name: "Starter" | "Pro" | "Business";
  priceMonthly: number;
  invoiceLimit: number | null; // null = unlimited
  clientLimit: number | null; // null = unlimited
  features: string[];
};

export const PLAN_DEFINITIONS: PlanDefinition[] = [
  {
    name: "Starter",
    priceMonthly: 85,
    invoiceLimit: null,
    clientLimit: null,
    features: [
      "Unlimited invoices, quotes & clients",
      "Saved items catalog",
      "Recurring auto-generated invoices",
      "Custom branding (logo, colors, 3 PDF templates)",
      "Email invoices & quotes to clients",
    ],
  },
  {
    name: "Pro",
    priceMonthly: 149,
    invoiceLimit: null,
    clientLimit: null,
    features: [
      "Everything in Starter",
      "QuickBooks & Xero sync (coming soon)",
      "Priority support",
    ],
  },
  {
    name: "Business",
    priceMonthly: 249,
    invoiceLimit: null,
    clientLimit: null,
    features: [
      "Everything in Pro",
      "Multiple team logins (coming soon)",
      "QuickBooks & Xero sync (coming soon)",
    ],
  },
];
