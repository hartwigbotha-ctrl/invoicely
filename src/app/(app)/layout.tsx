import { requireBusiness } from "@/lib/session";

// These routes are all per-user/session data behind auth — never attempt a
// build-time static shell for them (Next.js may otherwise render this
// layout once at build time with no session, bake in the resulting
// redirect("/login") as a cached "static shell", and later serve that
// stale redirect to real, authenticated users via prefetching).
export const dynamic = "force-dynamic";
import { signOut } from "@/lib/auth";
import { AppShell } from "./app-shell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { business, session } = await requireBusiness();

  async function signOutAction() {
    "use server";
    await signOut({ redirectTo: "/login" });
  }

  return (
    <AppShell businessName={business.name} userEmail={session.user?.email} signOutAction={signOutAction}>
      {children}
    </AppShell>
  );
}
