"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Users, Package, ShoppingCart, BarChart3, LogOut, Recycle } from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/warga", label: "Warga", icon: Users },
  { href: "/admin/setoran", label: "Setoran", icon: Package },
  { href: "/admin/penjualan", label: "Penjualan", icon: ShoppingCart },
  { href: "/admin/stok", label: "Stok", icon: BarChart3 },
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    toast.success("Berhasil logout");
    router.push("/admin");
    router.refresh();
  }

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-56 flex-col border-r border-gray-200 bg-white lg:flex">
        {/* Logo */}
        <div className="flex h-16 items-center gap-2 border-b border-gray-100 px-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600">
            <Recycle className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900">Bank Sampah</p>
            <p className="text-xs text-gray-500">Admin Panel</p>
          </div>
        </div>
        {/* Nav */}
        <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
          {navItems.map(({ href, label, icon: Icon, exact }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive(href, exact)
                  ? "bg-brand-50 text-brand-700"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              )}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              {label}
            </Link>
          ))}
        </nav>
        {/* Logout */}
        <div className="border-t border-gray-100 p-3">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main content area */}
      <div className="lg:pl-56">
        {/* Top bar (mobile) */}
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-gray-200 bg-white px-4 lg:hidden">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-brand-600">
              <Recycle className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-bold text-gray-900">Bank Sampah Admin</span>
          </div>
          <button onClick={handleLogout} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100">
            <LogOut className="h-4 w-4" />
          </button>
        </header>

        {/* Page content */}
        <main className="pb-20 lg:pb-0">{children}</main>
      </div>

      {/* Bottom navigation (mobile) */}
      <nav className="fixed bottom-0 inset-x-0 z-30 border-t border-gray-200 bg-white lg:hidden">
        <div className="flex">
          {navItems.map(({ href, label, icon: Icon, exact }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 py-2.5 text-xs font-medium transition-colors",
                isActive(href, exact)
                  ? "text-brand-700"
                  : "text-gray-500"
              )}
            >
              <Icon
                className={cn(
                  "h-5 w-5",
                  isActive(href, exact) ? "text-brand-600" : "text-gray-400"
                )}
              />
              <span className="truncate">{label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
