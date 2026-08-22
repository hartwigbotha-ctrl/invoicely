"use server";

import { requireBusiness } from "@/lib/session";
import { db } from "@/db";
import { supportTickets } from "@/db/schema";
import { sendSupportTicketEmail } from "@/lib/mailer";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export type SupportState = { error?: string; success?: boolean };

export async function submitSupportTicket(
  _prevState: SupportState,
  formData: FormData
): Promise<SupportState> {
  const { session, business } = await requireBusiness();
  const message = ((formData.get("message") as string) ?? "").trim();
  const pageUrl = (formData.get("pageUrl") as string) || null;

  if (!message) {
    return { error: "Tell us a bit about what's going wrong before sending." };
  }
  if (message.length > 4000) {
    return { error: "That's a lot of detail — please keep it under 4000 characters." };
  }

  const userId = (session.user as { id?: string })?.id ?? null;
  const userEmail = session.user?.email ?? null;

  const [ticket] = await db
    .insert(supportTickets)
    .values({
      businessId: business.id,
      userId,
      message,
      pageUrl,
    })
    .returning();

  try {
    const info = await sendSupportTicketEmail({
      businessName: business.name,
      businessEmail: business.email,
      userEmail,
      message,
      pageUrl,
      ticketId: ticket.id,
    });
    if (info) {
      await db.update(supportTickets).set({ emailedOk: true }).where(eq(supportTickets.id, ticket.id));
    }
  } catch (err) {
    // Don't fail the report just because the email send failed — the
    // ticket is already saved, and we don't want a customer's problem
    // report to itself error out. Log for visibility instead.
    console.error("[support] failed to email ticket", ticket.id, err);
  }

  revalidatePath("/support");
  return { success: true };
}
