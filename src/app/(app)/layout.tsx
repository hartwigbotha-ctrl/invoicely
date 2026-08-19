import Link from "next/link";
import { requireBusiness } from "@/lib/session";

// These routes are all per-user/session data behind auth — never attempt a
// build-time static shell for them (Next.js may otherwise render this
// layout once at build time with no session, bake in the resulting
// redirect("/login") as a cached "static shell", and later serve that
// stale redirect to real, authenticated users via prefetching).
export const dynamic = "force-dynamic";
import { signOut } from "@/lib/auth";
import {
  LayoutDashboard,
  Users,
  FileText,
  Repeat,
  Settings,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/invoices", label: "Invoices", icon: FileText },
  { href: "/clients", label: "Clients", icon: Users },
  { href: "/recurring", label: "Recurring", icon: Repeat },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { business, session } = await requireBusiness();

  return (
    <div className="flex-1 flex">
      <aside className="w-60 shrink-0 border-r border-gray-200 bg-white flex flex-col">
        <div className="px-5 py-5 border-b border-gray-200">
          <Link href="/dashboard" className="text-lg font-bold">
            Invoicely
          </Link>
          <p className="text-xs text-gray-500 mt-0.5 truncate">{business.name}</p>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-100"
            >
              <item.icon size={16} />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="px-3 py-4 border-t border-gray-200">
          <p className="px-3 text-xs text-gray-500 truncate mb-2">
            {session.user?.email}
          </p>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <button
              type="submit"
              className="w-full text-left px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-100"
            >
              Log out
            </button>
          </form>
        </div>
      </aside>
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}
