"use client";
import { useState, useEffect } from "react";
import { Plus, Trash2, Package } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { PageHeader } from "@/components/admin/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { LoadingSpinner, EmptyState } from "@/components/ui/Feedback";
import { formatKg, formatDateShort, todayISO } from "@/lib/utils";
import type { Warga, CollectionBatch, Setoran } from "@/types";
import toast from "react-hot-toast";

export default function AdminSetoranPage() {
  const [batches, setBatches] = useState<CollectionBatch[]>([]);
  const [warga, setWarga] = useState<Warga[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<string>("");
  const [setoran, setSetoran] = useState<Setoran[]>([]);
  const [loadingSetoran, setLoadingSetoran] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [newBatchModal, setNewBatchModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newBatchDate, setNewBatchDate] = useState(todayISO());
  const [form, setForm] = useState({ warga_id: "", berat_kg: "" });

  async function load() {
    const [bRes, wRes] = await Promise.all([
      fetch("/api/collection-batch").then((r) => r.json()),
      fetch("/api/warga").then((r) => r.json()),
    ]);
    const allBatches: CollectionBatch[] = bRes.data ?? [];
    setBatches(allBatches);
    setWarga((wRes.data ?? []).filter((w: Warga) => w.aktif !== false));
    if (!selectedBatch && allBatches.length > 0) {
      const pending = allBatches.find((b) => b.status === "pending");
      setSelectedBatch(pending?.id ?? allBatches[allBatches.length - 1].id);
    }
  }

  async function loadSetoran(batchId: string) {
    if (!batchId) return;
    setLoadingSetoran(true);
    try {
      const res = await fetch(`/api/setoran?batch_id=${batchId}`);
      const data = await res.json();
      setSetoran(data.data ?? []);
    } finally {
      setLoadingSetoran(false);
    }
  }

  useEffect(() => { load(); }, []);
  useEffect(() => { if (selectedBatch) loadSetoran(selectedBatch); }, [selectedBatch]);

  async function createBatch() {
    setSaving(true);
    try {
      const res = await fetch("/api/collection-batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tanggal: newBatchDate }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast.success(`Batch ${data.data.id} dibuat`);
      setNewBatchModal(false);
      await load();
      setSelectedBatch(data.data.id);
    } catch (e) {
      toast.error(String(e));
    } finally {
      setSaving(false);
    }
  }

  async function addSetoran() {
    if (!form.warga_id || !form.berat_kg) {
      toast.error("Pilih warga dan isi berat");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/setoran", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          batch_id: selectedBatch,
          warga_id: form.warga_id,
          berat_kg: parseFloat(form.berat_kg),
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast.success("Setoran tersimpan");
      setModalOpen(false);
      setForm({ warga_id: "", berat_kg: "" });
      await loadSetoran(selectedBatch);
    } catch (e) {
      toast.error(String(e));
    } finally {
      setSaving(false);
    }
  }

  async function deleteSetoran(id: string) {
    if (!confirm("Hapus setoran ini?")) return;
    try {
      const res = await fetch("/api/setoran", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast.success("Setoran dihapus");
      await loadSetoran(selectedBatch);
    } catch (e) {
      toast.error(String(e));
    }
  }

  const activeBatch = batches.find((b) => b.id === selectedBatch);
  const totalKg = setoran.reduce((sum, s) => sum + s.berat_kg, 0);

  return (
    <AdminLayout>
      <PageHeader
        title="Input Setoran"
        description="Catat setoran sampah per warga"
        action={
          <Button onClick={() => setNewBatchModal(true)} size="sm" variant="outline">
            <Plus className="h-4 w-4" /> Batch Baru
          </Button>
        }
      />

      <div className="p-4 space-y-4">
        {/* Batch selector */}
        <Select
          label="Pilih Batch Pengumpulan"
          value={selectedBatch}
          onChange={(e) => setSelectedBatch(e.target.value)}
          options={batches.map((b) => ({
            value: b.id,
            label: `${b.id} — ${formatDateShort(b.tanggal)} (${b.status === "sold" ? "Terjual" : "Pending"})`,
          }))}
          placeholder="Pilih batch..."
        />

        {activeBatch && (
          <Card className="flex items-center justify-between" padding="sm">
            <div>
              <p className="font-medium text-gray-900">{activeBatch.id}</p>
              <p className="text-xs text-gray-500">{formatDateShort(activeBatch.tanggal)}</p>
            </div>
            <div className="text-right">
              <Badge variant={activeBatch.status === "sold" ? "green" : "yellow"}>
                {activeBatch.status === "sold" ? "Terjual" : "Pending"}
              </Badge>
              <p className="mt-1 text-xs font-medium text-gray-700">Total: {formatKg(totalKg)}</p>
            </div>
          </Card>
        )}

        {activeBatch?.status !== "sold" && (
          <Button
            onClick={() => { setForm({ warga_id: "", berat_kg: "" }); setModalOpen(true); }}
            fullWidth
            disabled={!selectedBatch}
          >
            <Plus className="h-4 w-4" /> Tambah Setoran
          </Button>
        )}

        {loadingSetoran ? (
          <LoadingSpinner />
        ) : setoran.length === 0 ? (
          <EmptyState icon={Package} title="Belum ada setoran" description="Tambah setoran untuk batch ini" />
        ) : (
          <div className="space-y-2">
            {setoran.map((s) => (
              <Card key={s.id} className="flex items-center justify-between" padding="sm">
                <div>
                  <p className="font-medium text-gray-900">{s.warga_nama ?? s.warga_id}</p>
                  <p className="text-xs text-gray-500">RT {s.warga_rt}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-brand-700">{formatKg(s.berat_kg)}</span>
                  {activeBatch?.status !== "sold" && (
                    <button
                      onClick={() => deleteSetoran(s.id)}
                      className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Add setoran modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Tambah Setoran">
        <div className="space-y-4">
          <Select
            label="Warga"
            value={form.warga_id}
            onChange={(e) => setForm({ ...form, warga_id: e.target.value })}
            options={warga.map((w) => ({ value: w.id, label: `${w.nama} (RT ${w.rt})` }))}
            placeholder="Pilih warga..."
            required
          />
          <Input
            label="Berat (kg)"
            type="number"
            step="0.1"
            min="0.1"
            value={form.berat_kg}
            onChange={(e) => setForm({ ...form, berat_kg: e.target.value })}
            placeholder="contoh: 2.5"
            required
          />
          <div className="flex gap-2 pt-2">
            <Button variant="outline" fullWidth onClick={() => setModalOpen(false)}>Batal</Button>
            <Button fullWidth loading={saving} onClick={addSetoran}>Simpan</Button>
          </div>
        </div>
      </Modal>

      {/* New batch modal */}
      <Modal open={newBatchModal} onClose={() => setNewBatchModal(false)} title="Buat Batch Baru" size="sm">
        <div className="space-y-4">
          <Input
            label="Tanggal Pengumpulan"
            type="date"
            value={newBatchDate}
            onChange={(e) => setNewBatchDate(e.target.value)}
            required
          />
          <div className="flex gap-2 pt-2">
            <Button variant="outline" fullWidth onClick={() => setNewBatchModal(false)}>Batal</Button>
            <Button fullWidth loading={saving} onClick={createBatch}>Buat Batch</Button>
          </div>
        </div>
      </Modal>
    </AdminLayout>
  );
}
