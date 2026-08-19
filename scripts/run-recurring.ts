/**
 * Standalone script that generates (and auto-sends) invoices for every
 * recurring schedule that is due today or earlier.
 *
 * Run manually with `npm run recurring:run`, or schedule it:
 *   - Self-hosted / VPS: a cron entry, e.g. `0 6 * * * npm run recurring:run --prefix /path/to/app`
 *   - Vercel: a Vercel Cron Job hitting an API route that calls runDueSchedules()
 *   - Any host: node-cron in a long-running process (see src/lib/cron.ts)
 */
import { runDueSchedules } from "@/lib/recurring-engine";

async function main() {
  const results = await runDueSchedules();
  if (results.length === 0) {
    console.log("No recurring schedules were due.");
    return;
  }
  for (const r of results) {
    console.log(
      `Schedule ${r.scheduleId} -> invoice ${r.invoiceId} (${r.sent ? "sent" : "drafted"})`
    );
  }
  console.log(`Done. Generated ${results.length} invoice(s).`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("recurring:run failed", err);
    process.exit(1);
  });
