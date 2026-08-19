import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function LandingPage() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  return (
    <main className="flex-1 flex flex-col">
      <header className="border-b border-gray-200 bg-white">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <span className="text-xl font-bold">Invoicely</span>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/login" className="text-gray-600 hover:text-gray-900">
              Log in
            </Link>
            <Link
              href="/register"
              className="bg-gray-900 text-white px-4 py-2 rounded-md hover:bg-gray-800"
            >
              Start free trial
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
            Start your 14-day free trial
          </Link>
          <Link
            href="/login"
            className="px-6 py-3 rounded-md font-medium border border-gray-300 hover:bg-gray-100"
          >
            I already have an account
          </Link>
        </div>

        <div className="mt-24 grid sm:grid-cols-3 gap-8 text-left">
          <Feature
            title="Auto-numbered invoices"
            body="Every invoice gets a clean, sequential number. No more duplicate INV-001 files."
          />
          <Feature
            title="Recurring invoices"
            body="Set a schedule once and Invoicely generates and emails the invoice automatically, on time, every time."
          />
          <Feature
            title="Get paid faster"
            body="Track sent, paid and overdue invoices at a glance, and send professional PDF invoices in one click."
          />
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
