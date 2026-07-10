import Link from "next/link";
import { Recycle, TrendingUp, Users, Coins, Package, ExternalLink } from "lucide-react";
import { getDashboardStats } from "@/lib/services/dashboard";
import { getSaleBatches } from "@/lib/services/penjualan";
import { StatCard } from "@/components/ui/StatCard";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatRupiah, formatKg, formatDateShort } from "@/lib/utils";

export const revalidate = 60; // revalidate every 60 seconds

export default async function HomePage() {
  const [stats, sales] = await Promise.all([
    getDashboardStats(),
    getSaleBatches(),
  ]);

  const recentSales = sales.slice(-5).reverse();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Header */}
      <header className="bg-gradient-to-br from-brand-700 to-brand-600 px-4 pb-8 pt-10 text-white">
        <div className="mx-auto max-w-2xl">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
              <Recycle className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Bank Sampah Warga</h1>
              <p className="text-sm text-brand-200">Transparansi untuk semua</p>
            </div>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-brand-100">
            Pantau hasil penjualan sampah, saldo warga, dan kas Karang Taruna secara real-time.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 pb-8 -mt-4">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <StatCard
            title="Total Warga"
            value={stats.total_warga.toString()}
            subtitle="warga aktif"
            icon={Users}
            color="blue"
          />
          <StatCard
            title="Total Sampah"
            value={formatKg(stats.total_sampah_kg)}
            subtitle="terkumpul"
            icon={Package}
            color="green"
          />
          <StatCard
            title="Total Penjualan"
            value={formatRupiah(stats.total_penjualan)}
            subtitle="seluruh periode"
            icon={TrendingUp}
            color="yellow"
          />
          <StatCard
            title="Kas Karang Taruna"
            value={formatRupiah(stats.total_kas_karang_taruna)}
            subtitle="50% dari penjualan"
            icon={Coins}
            color="purple"
          />
        </div>

        {/* Saldo Warga highlight */}
        <Card className="mb-6 border-brand-200 bg-brand-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-brand-600">
                Total Saldo Warga
              </p>
              <p className="mt-1 text-2xl font-bold text-brand-800">
                {formatRupiah(stats.total_saldo_warga)}
              </p>
              <p className="mt-0.5 text-xs text-brand-600">
                50% dari hasil penjualan dibagi proporsional
              </p>
            </div>
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-100">
              <Recycle className="h-7 w-7 text-brand-700" />
            </div>
          </div>
        </Card>

        {/* Recent Sales */}
        <Card padding="none" className="mb-6">
          <CardHeader className="px-4 pt-4 pb-3">
            <CardTitle>Riwayat Penjualan</CardTitle>
            <Link
              href="/batch"
              className="text-xs font-medium text-brand-600 hover:text-brand-700"
            >
              Lihat semua
            </Link>
          </CardHeader>
          {recentSales.length === 0 ? (
            <p className="px-4 pb-4 text-sm text-gray-400">Belum ada penjualan.</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {recentSales.map((sale) => (
                <div key={sale.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {sale.id}
                    </p>
                    <p className="text-xs text-gray-500">{formatDateShort(sale.tanggal_jual)}</p>
                    <p className="text-xs text-gray-500">{formatKg(sale.total_kg)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-brand-700">
                      {formatRupiah(sale.total_penjualan)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatRupiah(sale.harga_per_kg)}/kg
                    </p>
                    {sale.nota_url && (
                      <a
                        href={sale.nota_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-0.5 text-xs text-blue-600 hover:underline"
                      >
                        Nota <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Quick links */}
        <div className="grid grid-cols-2 gap-3">
          <Link
            href="/warga"
            className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:border-brand-300 hover:bg-brand-50 transition-colors"
          >
            <Users className="h-5 w-5 text-brand-600" />
            <div>
              <p className="text-sm font-semibold text-gray-900">Cek Saldo</p>
              <p className="text-xs text-gray-500">Cari saldo warga</p>
            </div>
          </Link>
          <Link
            href="/batch"
            className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:border-brand-300 hover:bg-brand-50 transition-colors"
          >
            <Package className="h-5 w-5 text-brand-600" />
            <div>
              <p className="text-sm font-semibold text-gray-900">Riwayat</p>
              <p className="text-xs text-gray-500">Semua batch</p>
            </div>
          </Link>
        </div>

        <p className="mt-6 text-center text-xs text-gray-400">
          Data diperbarui otomatis • Admin:{" "}
          <Link href="/admin" className="text-brand-600 hover:underline">
            Login
          </Link>
        </p>
      </main>
    </div>
  );
}
