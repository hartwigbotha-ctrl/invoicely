import { requireBusiness } from "@/lib/session";
import { db } from "@/db";
import { invoices, clients } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { sweepOverdueInvoices, statusLabel } from "@/lib/invoice-utils";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

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

  const recent = allInvoices.slice(0, 8);

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <Link
          href="/invoices/new"
          className="bg-gray-900 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-800"
        >
          + New invoice
        </Link>
      </div>

      <div className="grid sm:grid-cols-4 gap-4 mb-10">
        <StatCard label="Outstanding" value={money(outstanding, business.currency)} />
        <StatCard label="Overdue" value={money(overdueAmount, business.currency)} accent="text-red-600" />
        <StatCard label="Paid this month" value={money(paidThisMonth, business.currency)} accent="text-green-600" />
        <StatCard label="Clients" value={String(clientCount)} />
      </div>

      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="font-semibold">Recent invoices</h2>
          <Link href="/invoices" className="text-sm text-gray-600 hover:underline">
            View all
          </Link>
        </div>
        {recent.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-500">
            No invoices yet.{" "}
            <Link href="/invoices/new" className="text-gray-900 underline">
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

function StatCard({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-2xl font-semibold ${accent || ""}`}>{value}</p>
    </div>
  );
}
