import { NextRequest, NextResponse } from "next/server";
import { runDueSchedules } from "@/lib/recurring-engine";

/**
 * Serverless-friendly trigger for recurring invoice generation.
 * Point a Vercel Cron Job (or any external scheduler) at this endpoint,
 * e.g. daily, and set CRON_SECRET so only your scheduler can call it:
 *   Authorization: Bearer <CRON_SECRET>
 *
 * Fails closed: without CRON_SECRET configured, this endpoint refuses every
 * request rather than running unauthenticated. It's public by URL (anyone
 * can find /api/cron/recurring), and it generates and emails real invoices
 * for every business — that must never be reachable without a secret.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "CRON_SECRET is not configured — refusing to run." },
      { status: 503 }
    );
  }

  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results = await runDueSchedules();
  return NextResponse.json({ generated: results.length, results });
}
