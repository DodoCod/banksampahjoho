import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { getCollectionBatches } from "@/lib/services/setoran";
import { getSaleBatches } from "@/lib/services/penjualan";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatRupiah, formatKg, formatDateShort, parseBatchIds } from "@/lib/utils";

export const revalidate = 60;

export default async function BatchPage() {
  const [batches, sales] = await Promise.all([
    getCollectionBatches(),
    getSaleBatches(),
  ]);

  const sortedSales = [...sales].reverse();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="mx-auto max-w-lg flex items-center gap-3">
          <Link href="/" className="text-gray-500 hover:text-gray-700">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-base font-bold text-gray-900">Riwayat Lengkap</h1>
            <p className="text-xs text-gray-500">Semua batch & penjualan</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 py-4 space-y-6">
        {/* Penjualan */}
        <section>
          <h2 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
            Riwayat Penjualan
          </h2>
          {sortedSales.length === 0 ? (
            <p className="text-sm text-gray-400">Belum ada penjualan.</p>
          ) : (
            <div className="space-y-3">
              {sortedSales.map((sale) => {
                const batchIds = parseBatchIds(sale.collection_batch_ids);
                return (
                  <Card key={sale.id} padding="sm">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <span className="font-bold text-brand-700">{sale.id}</span>
                        <p className="text-xs text-gray-500">{formatDateShort(sale.tanggal_jual)}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900">{formatRupiah(sale.total_penjualan)}</p>
                        <p className="text-xs text-gray-500">{formatKg(sale.total_kg)}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {batchIds.map((id) => (
                        <Badge key={id} variant="blue">{id}</Badge>
                      ))}
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Harga: {formatRupiah(sale.harga_per_kg)}/kg</span>
                      <span>
                        Warga: {formatRupiah(sale.total_penjualan * 0.5)} | KT: {formatRupiah(sale.total_penjualan * 0.5)}
                      </span>
                    </div>
                    {sale.nota_url && (
                      <a
                        href={sale.nota_url}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
                      >
                        <ExternalLink className="h-3 w-3" /> Lihat Nota
                      </a>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </section>

        {/* Batch Pengumpulan */}
        <section>
          <h2 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
            Batch Pengumpulan
          </h2>
          <div className="space-y-2">
            {[...batches].reverse().map((batch) => (
              <div
                key={batch.id}
                className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3"
              >
                <div>
                  <span className="font-medium text-gray-900">{batch.id}</span>
                  <p className="text-xs text-gray-500">{formatDateShort(batch.tanggal)}</p>
                </div>
                <Badge variant={batch.status === "sold" ? "green" : "yellow"}>
                  {batch.status === "sold" ? "Terjual" : "Belum Terjual"}
                </Badge>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
