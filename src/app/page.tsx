import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PLAN_DEFINITIONS } from "@/lib/plans";
import { Check } from "lucide-react";

export default async function LandingPage() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  return (
    <main className="flex-1 flex flex-col">
      <header className="border-b border-gray-200 bg-white sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <span className="text-xl font-bold">Invoicely</span>
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
              className="bg-gray-900 text-white px-4 py-2 rounded-md hover:bg-gray-800"
            >
              Get started
            </Link>
          </nav>
        </div>
      </header>

      <section className="flex-1 max-w-4xl mx-auto px-6 py-24 text-center">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
          Stop invoicing in spreadsheets.
        </h1>
        <p className="mt-6 text-lg text-gray-600 max-w-2xl mx-auto">
          Invoicely helps contractors and small businesses create professional
          invoices, chase payments, and auto-generate recurring invoices —
          without the copy-paste errors.
        </p>
        <div className="mt-10 flex items-center justify-center gap-4">
          <Link
            href="/register"
            className="bg-gray-900 text-white px-6 py-3 rounded-md font-medium hover:bg-gray-800"
          >
            Get started — from R85/month
          </Link>
          <Link
            href="/login"
            className="px-6 py-3 rounded-md font-medium border border-gray-300 hover:bg-gray-100"
          >
            I already have an account
          </Link>
        </div>

        <div id="features" className="mt-24 grid sm:grid-cols-3 gap-8 text-left scroll-mt-20">
          <Feature
            title="Auto-numbered invoices"
            body="Every invoice gets a clean, sequential number. No more duplicate INV-001 files."
          />
          <Feature
            title="Quotes & recurring invoices"
            body="Send quotes that convert to invoices on acceptance, and set a schedule once for invoices that generate and send themselves."
          />
          <Feature
            title="Get paid faster"
            body="Track sent, paid and overdue invoices at a glance, and send professional PDF invoices in one click."
          />
          <Feature
            title="Import your old records"
            body="Upload old Excel sheets, Word docs or scanned invoices and Invoicely reads them automatically — clients, items and totals detected, editable before import."
          />
          <Feature
            title="Works on your phone"
            body="Add Invoicely to your home screen and invoice clients from a building site as easily as from a desk."
          />
          <Feature
            title="Your brand, your PDFs"
            body="Add your logo and brand color, and pick from three invoice layouts — every PDF looks like it came from your business."
          />
        </div>
      </section>

      <section id="pricing" className="bg-gray-50 border-t border-gray-200 py-20 scroll-mt-14">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold">Simple, honest pricing</h2>
            <p className="mt-3 text-gray-600">No free tier, no trial — just one plan that pays for itself the first month.</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {PLAN_DEFINITIONS.map((plan) => (
              <div
                key={plan.name}
                className={`bg-white rounded-lg border p-6 flex flex-col ${
                  plan.name === "Pro" ? "border-gray-900 ring-1 ring-gray-900" : "border-gray-200"
                }`}
              >
                {plan.name === "Pro" && (
                  <span className="self-start mb-3 text-xs font-medium bg-gray-900 text-white px-2 py-1 rounded-full">
                    Most popular
                  </span>
                )}
                <h3 className="text-lg font-bold">{plan.name}</h3>
                <p className="mt-2">
                  <span className="text-3xl font-bold">R{plan.priceMonthly}</span>
                  <span className="text-gray-500 text-sm"> /month</span>
                </p>
                <ul className="mt-6 space-y-2 text-sm text-gray-700 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check size={16} className="text-gray-900 shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/register"
                  className={`mt-6 text-center px-4 py-2 rounded-md text-sm font-medium ${
                    plan.name === "Pro"
                      ? "bg-gray-900 text-white hover:bg-gray-800"
                      : "border border-gray-300 hover:bg-gray-100"
                  }`}
                >
                  Choose {plan.name}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-gray-200 py-6 text-center text-sm text-gray-500">
        © {new Date().getFullYear()} Invoicely
      </footer>
    </main>
  );
}

function Feature({ title, body }: { title: string; body: string }) {
  return (
    <div className="p-6 rounded-lg border border-gray-200 bg-white">
      <h3 className="font-semibold mb-2">{title}</h3>
      <p className="text-sm text-gray-600">{body}</p>
    </div>
  );
}
