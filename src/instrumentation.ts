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
