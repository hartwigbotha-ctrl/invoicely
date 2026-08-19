import { NextRequest, NextResponse } from "next/server";
import { runDueSchedules } from "@/lib/recurring-engine";

/**
 * Serverless-friendly trigger for recurring invoice generation.
 * Point a Vercel Cron Job (or any external scheduler) at this endpoint,
 * e.g. daily, and set CRON_SECRET so only your scheduler can call it:
 *   Authorization: Bearer <CRON_SECRET>
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const results = await runDueSchedules();
  return NextResponse.json({ generated: results.length, results });
}
