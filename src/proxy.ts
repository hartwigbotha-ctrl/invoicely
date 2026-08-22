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
    pathname.startsWith("/support");

  if (isProtected && !isLoggedIn) {
    const url = new URL("/login", req.nextUrl.origin);
    return NextResponse.redirect(url);
  }

  if (isAuthPage && isLoggedIn) {
    const url = new URL("/dashboard", req.nextUrl.origin);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
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
    "/login",
    "/register",
  ],
};
