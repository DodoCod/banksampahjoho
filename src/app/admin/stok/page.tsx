"use client";
import { useState, useEffect } from "react";
import { BarChart3, Package, TrendingUp } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { PageHeader } from "@/components/admin/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { LoadingSpinner, EmptyState } from "@/components/ui/Feedback";
import { formatKg, formatDateShort } from "@/lib/utils";
import type { CollectionBatch, Setoran } from "@/types";

interface BatchWithSetoran extends CollectionBatch {
  setoran: Setoran[];
  total_kg: number;
}

export default function AdminStokPage() {
  const [data, setData] = useState<BatchWithSetoran[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const bRes = await fetch("/api/collection-batch").then((r) => r.json());
        const batches: CollectionBatch[] = bRes.data ?? [];

        // Load setoran per batch
        const withSetoran = await Promise.all(
          batches.map(async (b) => {
            const sRes = await fetch(`/api/setoran?batch_id=${b.id}`).then((r) => r.json());
            const setoranList: Setoran[] = sRes.data ?? [];
            return {
              ...b,
              setoran: setoranList,
              total_kg: setoranList.reduce((sum, s) => sum + s.berat_kg, 0),
            };
          })
        );
        setData(withSetoran.reverse());
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const totalPending = data
    .filter((b) => b.status === "pending")
    .reduce((sum, b) => sum + b.total_kg, 0);

  const totalSold = data
    .filter((b) => b.status === "sold")
    .reduce((sum, b) => sum + b.total_kg, 0);

  return (
    <AdminLayout>
      <PageHeader title="Monitor Stok" description="Status pengumpulan per batch" />

      <div className="p-4 space-y-4">
        {/* Summary */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="border-l-4 border-l-earth-500" padding="sm">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Stok Pending</p>
            <p className="text-xl font-bold text-earth-700">{formatKg(totalPending)}</p>
            <p className="text-xs text-gray-500">belum terjual</p>
          </Card>
          <Card className="border-l-4 border-l-brand-500" padding="sm">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Total Terjual</p>
            <p className="text-xl font-bold text-brand-700">{formatKg(totalSold)}</p>
            <p className="text-xs text-gray-500">seluruh periode</p>
          </Card>
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : data.length === 0 ? (
          <EmptyState icon={Package} title="Belum ada batch" description="Buat batch baru di menu Setoran" />
        ) : (
          <div className="space-y-3">
            {data.map((batch) => (
              <Card key={batch.id} padding="sm">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900">{batch.id}</span>
                      <Badge variant={batch.status === "sold" ? "green" : "yellow"}>
                        {batch.status === "sold" ? "Terjual" : "Pending"}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-500">{formatDateShort(batch.tanggal)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-brand-700">{formatKg(batch.total_kg)}</p>
                    <p className="text-xs text-gray-500">{batch.setoran.length} warga</p>
                  </div>
                </div>

                {/* Progress bar visual */}
                {batch.setoran.length > 0 && (
                  <div className="space-y-1.5">
                    {batch.setoran
                      .sort((a, b) => b.berat_kg - a.berat_kg)
                      .slice(0, 5)
                      .map((s) => {
                        const pct = batch.total_kg > 0
                          ? Math.round((s.berat_kg / batch.total_kg) * 100)
                          : 0;
                        return (
                          <div key={s.id} className="flex items-center gap-2">
                            <span className="w-24 truncate text-xs text-gray-600">
                              {s.warga_nama ?? s.warga_id}
                            </span>
                            <div className="flex-1 overflow-hidden rounded-full bg-gray-100 h-2">
                              <div
                                className="h-2 rounded-full bg-brand-500"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="w-14 text-right text-xs text-gray-500">
                              {formatKg(s.berat_kg)}
                            </span>
                          </div>
                        );
                      })}
                    {batch.setoran.length > 5 && (
                      <p className="text-xs text-gray-400 text-center">
                        +{batch.setoran.length - 5} warga lainnya
                      </p>
                    )}
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
