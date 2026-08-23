import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PLAN_DEFINITIONS } from "@/lib/plans";
import { PricingCards } from "./pricing-cards";
import {
  Hash,
  RefreshCw,
  Wallet,
  UploadCloud,
  Smartphone,
  Palette,
  ArrowRight,
} from "lucide-react";

export default async function LandingPage() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  return (
    <main className="flex-1 flex flex-col bg-white">
      <header className="border-b border-gray-100 bg-white/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <span className="flex items-center gap-2 text-xl font-extrabold tracking-tight">
            <span className="h-7 w-7 rounded-lg bg-gradient-to-br from-indigo-600 to-fuchsia-500" />
            Voxbil
          </span>
          <nav className="flex items-center gap-6 text-sm">
            <a href="#features" className="hidden sm:inline text-gray-600 hover:text-gray-900">
              Features
            </a>
            <a href="#pricing" className="hidden sm:inline text-gray-600 hover:text-gray-900">
              Pricing
            </a>
            <Link href="/login" className="text-gray-600 hover:text-gray-900">
              Log in
            </Link>
            <Link
              href="/register"
              className="bg-gray-900 text-white px-4 py-2 rounded-md hover:bg-gray-800 font-medium"
            >
              Get started
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600">
        <div
          aria-hidden
          className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:32px_32px]"
        />
        <div className="relative max-w-4xl mx-auto px-6 py-24 sm:py-28 text-center">
          <span className="inline-block bg-white/15 text-white text-xs font-semibold tracking-wide uppercase px-3 py-1 rounded-full border border-white/25">
            Built for South African contractors &amp; small businesses
          </span>
          <h1 className="mt-6 text-4xl sm:text-6xl font-extrabold tracking-tight text-white">
            Stop invoicing in spreadsheets.
          </h1>
          <p className="mt-6 text-lg text-indigo-100 max-w-2xl mx-auto">
            Voxbil helps contractors and small businesses create professional
            invoices, chase payments, and auto-generate recurring invoices —
            without the copy-paste errors.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white text-indigo-700 px-6 py-3 rounded-lg font-semibold shadow-lg shadow-indigo-900/20 hover:bg-indigo-50 transition-colors"
            >
              Get started — from R85/month
              <ArrowRight size={18} />
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto px-6 py-3 rounded-lg font-medium text-white border border-white/40 hover:bg-white/10 transition-colors"
            >
              I already have an account
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="scroll-mt-20 max-w-6xl mx-auto px-6 py-24">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Everything your invoicing needs, nothing it doesn&apos;t
          </h2>
          <p className="mt-3 text-gray-600 max-w-xl mx-auto">
            Built specifically for the way small contracting businesses actually work.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <Feature
            icon={Hash}
            color="indigo"
            title="Auto-numbered invoices"
            body="Every invoice gets a clean, sequential number. No more duplicate INV-001 files."
          />
          <Feature
            icon={RefreshCw}
            color="violet"
            title="Quotes & recurring invoices"
            body="Send quotes that convert to invoices on acceptance, and set a schedule once for invoices that generate and send themselves."
          />
          <Feature
            icon={Wallet}
            color="fuchsia"
            title="Get paid faster"
            body="Track sent, paid and overdue invoices at a glance, and send professional PDF invoices in one click."
          />
          <Feature
            icon={UploadCloud}
            color="blue"
            title="Import your old records"
            body="Upload old Excel sheets, Word docs or scanned invoices and Voxbil reads them automatically — clients, items and totals detected, editable before import."
          />
          <Feature
            icon={Smartphone}
            color="emerald"
            title="Works on your phone"
            body="Add Voxbil to your home screen and invoice clients from a building site as easily as from a desk."
          />
          <Feature
            icon={Palette}
            color="amber"
            title="Your brand, your PDFs"
            body="Add your logo and brand color, and pick from three invoice layouts — every PDF looks like it came from your business."
          />
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="scroll-mt-14 bg-gray-50 border-y border-gray-100 py-24">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Simple, honest pricing</h2>
            <p className="mt-3 text-gray-600">No free tier, no trial — just one plan that pays for itself the first month.</p>
          </div>
          <PricingCards plans={PLAN_DEFINITIONS} />
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="max-w-4xl mx-auto px-6 py-24 text-center">
        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
          Ready to leave the spreadsheet behind?
        </h2>
        <p className="mt-4 text-gray-600">
          Set up your business in minutes and send your first professional invoice today.
        </p>
        <div className="mt-8">
          <Link
            href="/register"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-fuchsia-600 text-white px-6 py-3 rounded-lg font-semibold shadow-lg shadow-indigo-600/20 hover:opacity-90 transition-opacity"
          >
            Get started — from R85/month
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      <footer className="border-t border-gray-100 py-6 text-center text-sm text-gray-500">
        © {new Date().getFullYear()} Voxbil
      </footer>
    </main>
  );
}

const COLOR_MAP = {
  indigo: "bg-indigo-50 text-indigo-600",
  violet: "bg-violet-50 text-violet-600",
  fuchsia: "bg-fuchsia-50 text-fuchsia-600",
  blue: "bg-blue-50 text-blue-600",
  emerald: "bg-emerald-50 text-emerald-600",
  amber: "bg-amber-50 text-amber-600",
} as const;

function Feature({
  icon: Icon,
  color,
  title,
  body,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color: keyof typeof COLOR_MAP;
  title: string;
  body: string;
}) {
  return (
    <div className="p-6 rounded-2xl border border-gray-200 bg-white hover:shadow-md hover:-translate-y-0.5 transition-all">
      <div className={`h-11 w-11 rounded-xl flex items-center justify-center mb-4 ${COLOR_MAP[color]}`}>
        <Icon size={22} />
      </div>
      <h3 className="font-semibold mb-2">{title}</h3>
      <p className="text-sm text-gray-600">{body}</p>
    </div>
  );
}
