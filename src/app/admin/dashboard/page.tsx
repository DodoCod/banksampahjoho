import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { getDashboardStats } from "@/lib/services/dashboard";
import { getPendingBatches } from "@/lib/services/setoran";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Users, Package, TrendingUp, Coins, AlertCircle } from "lucide-react";
import { formatRupiah, formatKg, formatDate } from "@/lib/utils";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  if (!isAuthenticated()) redirect("/admin");

  const [stats, pendingBatches] = await Promise.all([
    getDashboardStats(),
    getPendingBatches(),
  ]);

  return (
    <AdminLayout>
      <PageHeader
        title="Dashboard"
        description="Ringkasan data bank sampah"
      />
      <div className="p-4 space-y-4">
        {/* Alert pending batches */}
        {pendingBatches.length > 0 && (
          <div className="flex items-start gap-3 rounded-xl border border-earth-500/30 bg-earth-50 p-4">
            <AlertCircle className="h-5 w-5 text-earth-700 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-earth-800">
                {pendingBatches.length} batch belum terjual
              </p>
              <p className="text-xs text-earth-600 mt-0.5">
                Batch:{" "}
                {pendingBatches.map((b) => b.id).join(", ")}
              </p>
              <Link
                href="/admin/penjualan"
                className="mt-1.5 inline-block text-xs font-medium text-earth-700 underline"
              >
                Input penjualan →
              </Link>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            title="Total Warga"
            value={stats.total_warga.toString()}
            icon={Users}
            color="blue"
          />
          <StatCard
            title="Sampah Terkumpul"
            value={formatKg(stats.total_sampah_kg)}
            icon={Package}
            color="green"
          />
          <StatCard
            title="Total Penjualan"
            value={formatRupiah(stats.total_penjualan)}
            icon={TrendingUp}
            color="yellow"
          />
          <StatCard
            title="Kas Karang Taruna"
            value={formatRupiah(stats.total_kas_karang_taruna)}
            icon={Coins}
            color="purple"
          />
        </div>

        {/* Saldo warga */}
        <Card className="bg-brand-700 border-brand-700 text-white">
          <p className="text-xs font-medium uppercase tracking-wide text-brand-200">
            Total Saldo Warga
          </p>
          <p className="mt-1 text-2xl font-bold">
            {formatRupiah(stats.total_saldo_warga)}
          </p>
          <p className="mt-0.5 text-xs text-brand-200">
            50% dari penjualan dibagi proporsional
          </p>
        </Card>

        {/* Quick actions */}
        <Card padding="sm">
          <CardHeader>
            <CardTitle>Aksi Cepat</CardTitle>
          </CardHeader>
          <div className="grid grid-cols-2 gap-2">
            {[
              { href: "/admin/setoran", label: "Input Setoran", color: "bg-brand-50 text-brand-700 border-brand-200" },
              { href: "/admin/penjualan", label: "Input Penjualan", color: "bg-earth-50 text-earth-700 border-earth-200" },
              { href: "/admin/warga", label: "Kelola Warga", color: "bg-blue-50 text-blue-700 border-blue-200" },
              { href: "/admin/stok", label: "Monitor Stok", color: "bg-purple-50 text-purple-700 border-purple-200" },
            ].map(({ href, label, color }) => (
              <Link
                key={href}
                href={href}
                className={`rounded-lg border p-3 text-sm font-medium text-center transition-opacity hover:opacity-80 ${color}`}
              >
                {label}
              </Link>
            ))}
          </div>
        </Card>

        <p className="text-center text-xs text-gray-400">
          Terakhir diperbarui: {formatDate(stats.last_updated)}
        </p>
      </div>
    </AdminLayout>
  );
}
