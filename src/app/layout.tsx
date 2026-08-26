import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";
import "./globals.css";
import { RegisterServiceWorker } from "./register-sw";
import { InstallButton } from "./install-button";

// Force every route to render per-request instead of being statically
// optimized at build time. Without this, Next.js can prerender pages that
// gate on the signed-in user's session (via requireBusiness()/auth()) and
// then serve that single build-time snapshot — including its Server Action
// result — to every visitor, regardless of who's actually logged in. That
// showed up as: any form submission (new client, new invoice, etc.) reusing
// a stale cached "no session" outcome and bouncing everyone to /login.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Nimblo — Simple Invoicing for Contractors & Small Businesses",
  description: "Create, send, and auto-generate invoices for your small business.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Nimblo",
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icon-192.png", sizes: "192x192", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#111827",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-gray-50 text-gray-900">
        {children}
        <Toaster richColors position="top-center" />
        <RegisterServiceWorker />
        <InstallButton />
      </body>
    </html>
  );
}
