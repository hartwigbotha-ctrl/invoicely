import { auth } from "@/lib/auth";
import { db } from "@/db";
import { subscriptions } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { NextResponse } from "next/server";

// Routes that stay reachable even without an active subscription — a
// business that hasn't paid (or whose card failed) still needs to be able
// to pay us and to ask for help, just not to use the product itself.
const BILLING_EXEMPT_PREFIXES = ["/billing", "/support"];

export default auth(async function proxy(req) {
  const isLoggedIn = !!req.auth;
  const { pathname } = req.nextUrl;

  const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/register");
  const isProtected =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/clients") ||
    pathname.startsWith("/invoices") ||
    pathname.startsWith("/quotes") ||
    pathname.startsWith("/items") ||
    pathname.startsWith("/imports") ||
    pathname.startsWith("/recurring") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/support") ||
    pathname.startsWith("/billing") ||
    pathname.startsWith("/admin");

  if (isProtected && !isLoggedIn) {
    const url = new URL("/login", req.nextUrl.origin);
    return NextResponse.redirect(url);
  }

  if (isAuthPage && isLoggedIn) {
    const url = new URL("/dashboard", req.nextUrl.origin);
    return NextResponse.redirect(url);
  }

  const isBillingExempt = BILLING_EXEMPT_PREFIXES.some((p) => pathname.startsWith(p));
  // /admin is its own thing: it's exempt from the subscription paywall (an
  // admin's own test business may not have an active subscription) but is
  // NOT exempt from requiring login above, and does its own email-based
  // authorization inside the page itself (src/app/(app)/admin/page.tsx).
  const isAdminPath = pathname.startsWith("/admin");

  // No trial, no access without an active subscription — enforced HERE, at
  // the network boundary, not only in the (app) layout server component.
  // Next.js 16 rewrote the client-side prefetch cache to deduplicate a
  // shared layout's render across sibling <Link> navigations (see the
  // "Enhanced Routing and Navigation" / "Prefetch cache behavior" changes
  // in the Next 16 release notes), which meant a subscription check that
  // lived only in (app)/layout.tsx could run once on the first page load
  // and then be skipped on every subsequent client-side navigation to a
  // sibling route for the rest of that session — the exact bug Hartwig
  // found on video: land on /billing/subscribe (or /dashboard) once, then
  // every later click into /invoices, /clients/new, etc. rendered without
  // Next re-running the layout's server-side check. proxy.ts runs on the
  // Node.js runtime for every matched request (including the RSC fetch
  // behind a client-side navigation), so it can't be skipped that way. The
  // (app) layout keeps its own copy of this check too, as defense in depth.
  if (isLoggedIn && isProtected && !isAuthPage && !isBillingExempt && !isAdminPath) {
    const businessId = (req.auth?.user as { businessId?: string } | undefined)?.businessId;
    if (businessId) {
      const subscription = await db.query.subscriptions.findFirst({
        where: eq(subscriptions.businessId, businessId),
        orderBy: desc(subscriptions.createdAt),
      });
      if (!subscription || subscription.status !== "active") {
        const url = new URL("/billing/subscribe", req.nextUrl.origin);
        return NextResponse.redirect(url);
      }
    }
  }

  // Forward the pathname to the (app) layout so it can tell whether the
  // current request is already headed to /billing (or /support) — those
  // stay reachable even when a business has no active subscription, so a
  // blocked user isn't also locked out of paying or asking for help.
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-pathname", pathname);
  return NextResponse.next({ request: { headers: requestHeaders } });
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/clients/:path*",
    "/invoices/:path*",
    "/quotes/:path*",
    "/items/:path*",
    "/imports/:path*",
    "/recurring/:path*",
    "/settings/:path*",
    "/support/:path*",
    "/billing/:path*",
    "/admin/:path*",
    "/login",
    "/register",
  ],
};
