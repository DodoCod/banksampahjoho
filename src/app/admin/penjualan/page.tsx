"use client";
import { useState, useEffect } from "react";
import { Plus, ShoppingCart, ExternalLink } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { PageHeader } from "@/components/admin/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { LoadingSpinner, EmptyState } from "@/components/ui/Feedback";
import { FileUpload } from "@/components/ui/FileUpload";
import { formatRupiah, formatKg, formatDateShort, parseBatchIds, todayISO } from "@/lib/utils";
import type { CollectionBatch, SaleBatch } from "@/types";
import toast from "react-hot-toast";

export default function AdminPenjualanPage() {
  const [sales, setSales]       = useState<SaleBatch[]>([]);
  const [batches, setBatches]   = useState<CollectionBatch[]>([]);
  const [loading, setLoading]   = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving]     = useState(false);
  const [form, setForm] = useState({
    tanggal_jual:      todayISO(),
    total_kg:          "",
    total_penjualan:   "",
    nota_url:          "",   // URL final dari Drive
    nota_thumb:        "",   // thumbnail URL
    selected_batches:  [] as string[],
  });

  async function load() {
    setLoading(true);
    try {
      const [sRes, bRes] = await Promise.all([
        fetch("/api/sale-batch").then((r) => r.json()),
        fetch("/api/collection-batch").then((r) => r.json()),
      ]);
      setSales(sRes.data ?? []);
      setBatches(bRes.data ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const pendingBatches = batches.filter((b) => b.status === "pending");

  function toggleBatch(id: string) {
    setForm((f) => ({
      ...f,
      selected_batches: f.selected_batches.includes(id)
        ? f.selected_batches.filter((b) => b !== id)
        : [...f.selected_batches, id],
    }));
  }

  function resetForm() {
    setForm({
      tanggal_jual:     todayISO(),
      total_kg:         "",
      total_penjualan:  "",
      nota_url:         "",
      nota_thumb:       "",
      selected_batches: [],
    });
  }

  // Harga per kg otomatis
  const hargaPerKg =
    form.total_kg && form.total_penjualan
      ? Math.round(parseFloat(form.total_penjualan) / parseFloat(form.total_kg))
      : 0;

  async function handleSave() {
    if (form.selected_batches.length === 0) {
      toast.error("Pilih minimal satu batch"); return;
    }
    if (!form.total_kg || !form.total_penjualan) {
      toast.error("Isi total berat dan total penjualan"); return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/sale-batch", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          collection_batch_ids: form.selected_batches,
          total_kg:             parseFloat(form.total_kg),
          total_penjualan:      parseFloat(form.total_penjualan),
          nota_url:             form.nota_url,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast.success(`Penjualan ${data.data.id} tersimpan! Saldo warga otomatis diperbarui.`);
      setModalOpen(false);
      resetForm();
      await load();
    } catch (e) {
      toast.error(String(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminLayout>
      <PageHeader
        title="Penjualan"
        description={`${sales.length} transaksi penjualan`}
        action={
          <Button
            onClick={() => setModalOpen(true)}
            size="sm"
            disabled={pendingBatches.length === 0}
          >
            <Plus className="h-4 w-4" /> Input Penjualan
          </Button>
        }
      />

      <div className="p-4 space-y-3">
        {pendingBatches.length === 0 && !loading && (
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700">
            Semua batch sudah terjual. Buat batch pengumpulan baru di menu Setoran.
          </div>
        )}

        {loading ? (
          <LoadingSpinner />
        ) : sales.length === 0 ? (
          <EmptyState icon={ShoppingCart} title="Belum ada penjualan" />
        ) : (
          [...sales].reverse().map((sale) => {
            const batchIds  = parseBatchIds(sale.collection_batch_ids);
            const danaWarga = sale.total_penjualan * 0.5;
            const danaKT    = sale.total_penjualan * 0.5;
            return (
              <Card key={sale.id} padding="sm">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-bold text-brand-700 text-base">{sale.id}</p>
                    <p className="text-xs text-gray-500">{formatDateShort(sale.tanggal_jual)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">{formatRupiah(sale.total_penjualan)}</p>
                    <p className="text-xs text-gray-500">
                      {formatKg(sale.total_kg)} • {formatRupiah(sale.harga_per_kg)}/kg
                    </p>
                  </div>
                </div>

                {/* Batch IDs */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {batchIds.map((id) => (
                    <Badge key={id} variant="blue">{id}</Badge>
                  ))}
                </div>

                {/* Pembagian */}
                <div className="grid grid-cols-2 gap-2 rounded-lg bg-gray-50 p-2 text-xs mb-2">
                  <div>
                    <p className="text-gray-500">Dana Warga (50%)</p>
                    <p className="font-semibold text-brand-700">{formatRupiah(danaWarga)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Kas KT (50%)</p>
                    <p className="font-semibold text-purple-700">{formatRupiah(danaKT)}</p>
                  </div>
                </div>

                {/* Nota */}
                {sale.nota_url && (
                  <a
                    href={sale.nota_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
                  >
                    <ExternalLink className="h-3 w-3" /> Lihat Nota
                  </a>
                )}
              </Card>
            );
          })
        )}
      </div>

      {/* ── Modal Input Penjualan ── */}
      <Modal
        open={modalOpen}
        onClose={() => { setModalOpen(false); resetForm(); }}
        title="Input Penjualan"
        size="lg"
      >
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          {/* Pilih batch */}
          <div>
            <p className="mb-2 text-sm font-medium text-gray-700">
              Pilih Batch Pengumpulan <span className="text-red-500">*</span>
            </p>
            {pendingBatches.length === 0 ? (
              <p className="text-sm text-gray-500">Tidak ada batch pending.</p>
            ) : (
              <div className="space-y-1.5">
                {pendingBatches.map((b) => (
                  <label
                    key={b.id}
                    className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 p-3 hover:bg-gray-50"
                  >
                    <input
                      type="checkbox"
                      checked={form.selected_batches.includes(b.id)}
                      onChange={() => toggleBatch(b.id)}
                      className="h-4 w-4 rounded border-gray-300 text-brand-600"
                    />
                    <div>
                      <span className="font-medium text-gray-900">{b.id}</span>
                      <span className="ml-2 text-xs text-gray-500">
                        {formatDateShort(b.tanggal)}
                      </span>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Berat & Harga */}
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Total Berat (kg)"
              type="number"
              step="0.1"
              min="0"
              value={form.total_kg}
              onChange={(e) => setForm({ ...form, total_kg: e.target.value })}
              placeholder="0"
              required
            />
            <Input
              label="Total Penjualan (Rp)"
              type="number"
              min="0"
              value={form.total_penjualan}
              onChange={(e) => setForm({ ...form, total_penjualan: e.target.value })}
              placeholder="0"
              required
            />
          </div>

          {/* Harga per kg otomatis */}
          {hargaPerKg > 0 && (
            <div className="rounded-lg bg-brand-50 px-3 py-2 text-sm">
              <span className="text-gray-600">Harga per kg: </span>
              <span className="font-semibold text-brand-700">{formatRupiah(hargaPerKg)}</span>
            </div>
          )}

          {/* Upload Nota — komponen baru */}
          <FileUpload
            value={form.nota_url}
            onChange={(url, thumb) =>
              setForm((f) => ({ ...f, nota_url: url, nota_thumb: thumb ?? "" }))
            }
            disabled={saving}
          />

          {/* Preview pembagian */}
          {form.total_penjualan && (
            <div className="grid grid-cols-2 gap-2 rounded-lg bg-gray-50 p-3 text-xs">
              <div>
                <p className="text-gray-500">Dana Warga (50%)</p>
                <p className="font-bold text-brand-700">
                  {formatRupiah(parseFloat(form.total_penjualan || "0") * 0.5)}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Kas KT (50%)</p>
                <p className="font-bold text-purple-700">
                  {formatRupiah(parseFloat(form.total_penjualan || "0") * 0.5)}
                </p>
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              fullWidth
              onClick={() => { setModalOpen(false); resetForm(); }}
              disabled={saving}
            >
              Batal
            </Button>
            <Button fullWidth loading={saving} onClick={handleSave}>
              Simpan & Generate Pembagian
            </Button>
          </div>
        </div>
      </Modal>
    </AdminLayout>
  );
}
