/**
 * Next.js instrumentation hook (runs once when the server starts).
 * Optionally starts an in-process cron job that generates recurring
 * invoices daily, so a self-hosted deployment doesn't need external cron.
 * Enable by setting RECURRING_CRON_ENABLED=true in the environment.
 * On serverless hosts (e.g. Vercel) prefer a platform Cron Job hitting
 * /api/cron/recurring instead, since long-running processes aren't available.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  // Apply any pending SQL migrations to the database on every server start.
  // This matters most on hosts like Railway, where a freshly-mounted volume
  // has no tables yet — without this, the app boots against an empty
  // database and every query fails with "no such table".
  try {
    const path = await import("path");
    const { db } = await import("@/db");
    const { migrate } = await import("drizzle-orm/better-sqlite3/migrator");
    migrate(db, { migrationsFolder: path.join(process.cwd(), "drizzle") });
    console.log("[db] migrations applied");

    // Seed the default subscription plans if they aren't there yet (no-op
    // if they already exist — see scripts/seed.ts for the same logic).
    const { plans } = await import("@/db/schema");
    const existingPlans = await db.query.plans.findMany();
    if (existingPlans.length === 0) {
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
          features: JSON.stringify(["Everything in Pro", "Multiple team members", "Custom branding"]),
        },
      ]);
      console.log("[db] seeded default subscription plans");
    }
  } catch (err) {
    console.error("[db] migration/seed failed", err);
  }

  if (process.env.RECURRING_CRON_ENABLED !== "true") return;

  const cron = await import("node-cron");
  const { runDueSchedules } = await import("@/lib/recurring-engine");

  // Runs once a day at 06:00 server time.
  cron.schedule("0 6 * * *", async () => {
    try {
      const results = await runDueSchedules();
      console.log(`[recurring cron] generated ${results.length} invoice(s)`);
    } catch (err) {
      console.error("[recurring cron] failed", err);
    }
  });

  console.log("[recurring cron] scheduled daily at 06:00");
}