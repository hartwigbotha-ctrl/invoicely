import { requireBusiness } from "@/lib/session";
import { db } from "@/db";
import { invoices, clients } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { sweepOverdueInvoices, statusLabel } from "@/lib/invoice-utils";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import {
  Wallet,
  AlertTriangle,
  CircleCheckBig,
  Users,
  Plus,
  ArrowRight,
  FileText,
} from "lucide-react";

function money(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-ZA", { style: "currency", currency }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  sent: "bg-blue-100 text-blue-700",
  paid: "bg-green-100 text-green-700",
  overdue: "bg-red-100 text-red-700",
  cancelled: "bg-gray-100 text-gray-500",
};

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export default async function DashboardPage() {
  const { business } = await requireBusiness();
  await sweepOverdueInvoices(business.id);

  const allInvoices = await db.query.invoices.findMany({
    where: eq(invoices.businessId, business.id),
    with: { client: true },
    orderBy: desc(invoices.createdAt),
  });

  const clientCount = (
    await db.query.clients.findMany({ where: eq(clients.businessId, business.id) })
  ).length;

  const outstanding = allInvoices
    .filter((i) => i.status === "sent" || i.status === "overdue")
    .reduce((sum, i) => sum + (i.total - i.amountPaid), 0);
  const overdueAmount = allInvoices
    .filter((i) => i.status === "overdue")
    .reduce((sum, i) => sum + (i.total - i.amountPaid), 0);
  const paidThisMonth = allInvoices
    .filter((i) => i.status === "paid" && i.paidAt?.slice(0, 7) === new Date().toISOString().slice(0, 7))
    .reduce((sum, i) => sum + i.amountPaid, 0);

  // Rough "collected vs outstanding" split for the little progress bar in
  // the hero — purely visual, not a precise accounting figure.
  const totalTracked = paidThisMonth + outstanding;
  const collectedPct = totalTracked > 0 ? Math.round((paidThisMonth / totalTracked) * 100) : 0;

  const recent = allInvoices.slice(0, 8);
  const currency = business.currency;

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 px-6 py-8 sm:px-8 sm:py-10 mb-8">
        <div
          aria-hidden
          className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:28px_28px]"
        />
        <div className="relative flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
          <div>
            <p className="text-indigo-100 text-sm font-medium">
              {greeting()}, {business.name}
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mt-1">
              {outstanding > 0
                ? `${money(outstanding, currency)} outstanding`
                : "You're all caught up"}
            </h1>
            {totalTracked > 0 && (
              <div className="mt-4 max-w-xs">
                <div className="flex justify-between text-xs text-indigo-100 mb-1.5">
                  <span>Collected this month</span>
                  <span>{collectedPct}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/20 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-white"
                    style={{ width: `${collectedPct}%` }}
                  />
                </div>
              </div>
            )}
          </div>
          <Link
            href="/invoices/new"
            className="inline-flex items-center justify-center gap-2 bg-white text-indigo-700 px-5 py-2.5 rounded-lg text-sm font-semibold shadow-lg shadow-indigo-900/20 hover:bg-indigo-50 transition-colors shrink-0"
          >
            <Plus size={16} strokeWidth={2.5} />
            New invoice
          </Link>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid sm:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Outstanding"
          value={money(outstanding, currency)}
          icon={Wallet}
          color="indigo"
        />
        <StatCard
          label="Overdue"
          value={money(overdueAmount, currency)}
          icon={AlertTriangle}
          color="red"
        />
        <StatCard
          label="Paid this month"
          value={money(paidThisMonth, currency)}
          icon={CircleCheckBig}
          color="green"
        />
        <StatCard label="Clients" value={String(clientCount)} icon={Users} color="fuchsia" />
      </div>

      {/* Recent invoices */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="font-semibold flex items-center gap-2">
            <FileText size={16} className="text-gray-400" />
            Recent invoices
          </h2>
          <Link
            href="/invoices"
            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium inline-flex items-center gap-1"
          >
            View all
            <ArrowRight size={14} />
          </Link>
        </div>
        {recent.length === 0 ? (
          <div className="p-10 text-center">
            <div className="mx-auto mb-3 h-10 w-10 rounded-full bg-indigo-50 flex items-center justify-center">
              <FileText size={18} className="text-indigo-500" />
            </div>
            <p className="text-sm text-gray-500 mb-3">No invoices yet.</p>
            <Link
              href="/invoices/new"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-white bg-gray-900 px-4 py-2 rounded-md hover:bg-gray-800"
            >
              <Plus size={14} />
              Create your first invoice
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-100">
                  <th className="px-5 py-2 font-medium">Number</th>
                  <th className="px-5 py-2 font-medium">Client</th>
                  <th className="px-5 py-2 font-medium">Status</th>
                  <th className="px-5 py-2 font-medium">Due</th>
                  <th className="px-5 py-2 font-medium text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((inv) => (
                  <tr key={inv.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                    <td className="px-5 py-3">
                      <Link href={`/invoices/${inv.id}`} className="font-medium hover:underline">
                        {inv.number}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-gray-600">{inv.client.name}</td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[inv.status]}`}>
                        {statusLabel(inv.status)}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-600">
                      {formatDistanceToNow(new Date(inv.dueDate), { addSuffix: true })}
                    </td>
                    <td className="px-5 py-3 text-right font-medium">
                      {money(inv.total, inv.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

const iconColors: Record<string, string> = {
  indigo: "bg-indigo-50 text-indigo-600",
  red: "bg-red-50 text-red-600",
  green: "bg-green-50 text-green-600",
  fuchsia: "bg-fuchsia-50 text-fuchsia-600",
};

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color: keyof typeof iconColors;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-sm transition-shadow">
      <div className={`h-9 w-9 rounded-lg flex items-center justify-center mb-3 ${iconColors[color]}`}>
        <Icon size={18} />
      </div>
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-2xl font-semibold text-gray-900">{value}</p>
    </div>
  );
}
