/**
 * Shared helper for the ADMIN_EMAIL-gated cross-tenant admin views/actions
 * (src/app/(app)/admin, src/lib/actions/admin.ts). There's no in-app
 * platform-admin role — access is purely by email, checked against a
 * comma-separated ADMIN_EMAIL env var. Kept in one place so the page and
 * the server actions it calls can never drift out of sync on who counts
 * as an admin.
 */
export function isAdminEmail(email: string | null | undefined): boolean {
  const adminEmails = (process.env.ADMIN_EMAIL || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  const normalized = (email ?? "").toLowerCase();
  return adminEmails.length > 0 && adminEmails.includes(normalized);
}
