"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Users, Package, ShoppingCart, BarChart3, LogOut, Recycle, AlertTriangle, Loader2 } from "lucide-react";
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
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleLogout() {
    try {
      setIsLoggingOut(true);
      await fetch("/api/auth/logout", { method: "POST" });
      toast.success("Berhasil logout");
      router.push("/admin");
      router.refresh();
    } catch (error) {
      toast.error("Gagal logout, silakan coba lagi");
    } finally {
      setIsLoggingOut(false);
      setIsLogoutModalOpen(false);
    }
  }

  // Perbaikan logika isActive: Dashboard menyala HANYA jika berada tepat di rute /admin
  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-56 flex-col border-r border-gray-200 bg-white lg:flex">
        {/* Logo */}
        <div className="flex h-16 items-center gap-2 border-b border-gray-100 px-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600">
            <Recycle className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900">Bank Sampah</p>
            <p className="text-xs text-gray-500">Admin Panel</p>
          </div>
        </div>
        {/* Nav Desktop */}
        <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
          {navItems.map(({ href, label, icon: Icon, exact }) => {
            const active = isActive(href, exact);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-brand-50 text-brand-700 font-semibold"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                )}
              >
                <Icon className={cn(
                  "h-4 w-4 flex-shrink-0 transition-colors",
                  active ? "text-brand-600" : "text-gray-400"
                )} />
                {label}
              </Link>
            );
          })}
        </nav>
        {/* Logout Desktop */}
        <div className="border-t border-gray-100 p-3">
          <button
            onClick={() => setIsLogoutModalOpen(true)}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors"
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
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-600">
              <Recycle className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-bold text-gray-900">Bank Sampah Admin</span>
          </div>
          <button onClick={() => setIsLogoutModalOpen(true)} className="rounded-lg p-2 text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors">
            <LogOut className="h-4 w-4" />
          </button>
        </header>

        {/* Page content */}
        <main className="pb-20 lg:pb-0">{children}</main>
      </div>

      {/* Bottom navigation (mobile) */}
      <nav className="fixed bottom-0 inset-x-0 z-30 border-t border-gray-200 bg-white lg:hidden">
        <div className="flex">
          {navItems.map(({ href, label, icon: Icon, exact }) => {
            const active = isActive(href, exact);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex flex-1 flex-col items-center gap-1 py-2.5 text-xs font-medium transition-colors",
                  active ? "text-brand-700 font-semibold" : "text-gray-500"
                )}
              >
                <Icon
                  className={cn(
                    "h-5 w-5 transition-colors",
                    active ? "text-brand-600" : "text-gray-400"
                  )}
                />
                <span className="truncate">{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Modal Konfirmasi Logout */}
      {isLogoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
          {/* Backdrop (Click outside ditutup hanya jika TIDAK sedang loading) */}
          <div 
            className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity"
            onClick={() => !isLoggingOut && setIsLogoutModalOpen(false)}
          />
          
          {/* Modal Content Card */}
          <div className="relative w-full max-w-sm overflow-hidden rounded-xl bg-white p-6 shadow-xl border border-gray-100 transition-all scale-in">
            <div className="flex gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-semibold text-gray-900">Konfirmasi Keluar</h3>
                <p className="text-sm text-gray-500 mt-1">Apakah Anda yakin ingin keluar dari halaman panel admin?</p>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end gap-3 text-sm font-medium">
              <button
                type="button"
                disabled={isLoggingOut}
                className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                onClick={() => setIsLogoutModalOpen(false)}
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isLoggingOut}
                className="inline-flex items-center justify-center rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700 transition-colors shadow-sm disabled:cursor-not-allowed disabled:bg-red-400 min-w-[80px]"
                onClick={handleLogout}
              >
                {isLoggingOut ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Keluar"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}