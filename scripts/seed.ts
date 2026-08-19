import { db } from "@/db";
import { plans } from "@/db/schema";

async function main() {
  const existing = await db.query.plans.findMany();
  if (existing.length > 0) {
    console.log(`Plans already seeded (${existing.length} found). Skipping.`);
    return;
  }

  await db.insert(plans).values([
    {
      name: "Starter",
      priceMonthly: 0,
      currency: "ZAR",
      invoiceLimit: 10,
      clientLimit: 5,
      features: JSON.stringify(["Up to 10 invoices/month", "Up to 5 clients", "1 recurring schedule"]),
    },
    {
      name: "Pro",
      priceMonthly: 149,
      currency: "ZAR",
      invoiceLimit: null,
      clientLimit: null,
      features: JSON.stringify([
        "Unlimited invoices",
        "Unlimited clients",
        "Unlimited recurring schedules",
        "Priority email support",
      ]),
    },
    {
      name: "Business",
      priceMonthly: 349,
      currency: "ZAR",
      invoiceLimit: null,
      clientLimit: null,
      features: JSON.stringify([
        "Everything in Pro",
        "Multiple team members",
        "Custom branding",
      ]),
    },
  ]);

  console.log("Seeded 3 subscription plans.");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Seed failed", err);
    process.exit(1);
  });
