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

    // Keep the subscription plans in sync with PLAN_DEFINITIONS on every boot
    // (upsert by name) rather than a one-time seed — this lets pricing/feature
    // changes ship the same way as any other code change, without a manual
    // DB migration each time. See src/lib/plans.ts for the source of truth.
    const { plans } = await import("@/db/schema");
    const { eq } = await import("drizzle-orm");
    const { PLAN_DEFINITIONS } = await import("@/lib/plans");
    for (const def of PLAN_DEFINITIONS) {
      const existing = await db.query.plans.findFirst({ where: eq(plans.name, def.name) });
      const values = {
        priceMonthly: def.priceMonthly,
        currency: "ZAR",
        invoiceLimit: def.invoiceLimit,
        clientLimit: def.clientLimit,
        features: JSON.stringify(def.features),
      };
      if (existing) {
        await db.update(plans).set(values).where(eq(plans.id, existing.id));
      } else {
        await db.insert(plans).values({ name: def.name, ...values });
      }
    }
    console.log("[db] subscription plans synced");
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
