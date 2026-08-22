import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth(function proxy(req) {
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
    pathname.startsWith("/billing");

  if (isProtected && !isLoggedIn) {
    const url = new URL("/login", req.nextUrl.origin);
    return NextResponse.redirect(url);
  }

  if (isAuthPage && isLoggedIn) {
    const url = new URL("/dashboard", req.nextUrl.origin);
    return NextResponse.redirect(url);
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
    "/login",
    "/register",
  ],
};
