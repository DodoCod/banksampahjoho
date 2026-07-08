"use client";
import { useState, useEffect } from "react";
import { Plus, Search, UserCheck, UserX, Pencil } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { PageHeader } from "@/components/admin/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { LoadingSpinner, EmptyState } from "@/components/ui/Feedback";
import { Card } from "@/components/ui/Card";
import type { Warga } from "@/types";
import toast from "react-hot-toast";

export default function AdminWargaPage() {
  const [warga, setWarga] = useState<Warga[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Warga | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ nama: "", rt: "", nomor_hp: "" });

  async function loadWarga() {
    setLoading(true);
    try {
      const res = await fetch("/api/warga");
      const data = await res.json();
      setWarga(data.data ?? []);
    } catch {
      toast.error("Gagal memuat data warga");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadWarga(); }, []);

  function openAdd() {
    setEditTarget(null);
    setForm({ nama: "", rt: "", nomor_hp: "" });
    setModalOpen(true);
  }

  function openEdit(w: Warga) {
    setEditTarget(w);
    setForm({ nama: w.nama, rt: w.rt, nomor_hp: w.nomor_hp });
    setModalOpen(true);
  }

  async function handleSave() {
    if (!form.nama.trim() || !form.rt.trim()) {
      toast.error("Nama dan RT wajib diisi");
      return;
    }
    setSaving(true);
    try {
      if (editTarget) {
        const res = await fetch(`/api/warga/${editTarget.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error);
        toast.success("Data warga diperbarui");
      } else {
        const res = await fetch("/api/warga", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error);
        toast.success("Warga berhasil ditambahkan");
      }
      setModalOpen(false);
      await loadWarga();
    } catch (e) {
      toast.error(String(e));
    } finally {
      setSaving(false);
    }
  }

  async function toggleAktif(w: Warga) {
    try {
      const res = await fetch(`/api/warga/${w.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aktif: !w.aktif }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast.success(w.aktif ? "Warga dinonaktifkan" : "Warga diaktifkan");
      await loadWarga();
    } catch (e) {
      toast.error(String(e));
    }
  }

  const filtered = warga.filter(
    (w) =>
      w.nama.toLowerCase().includes(search.toLowerCase()) ||
      w.rt.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      <PageHeader
        title="Data Warga"
        description={`${warga.filter((w) => w.aktif !== false).length} warga aktif`}
        action={
          <Button onClick={openAdd} size="sm">
            <Plus className="h-4 w-4" /> Tambah Warga
          </Button>
        }
      />

      <div className="p-4 space-y-4">
        <Input
          placeholder="Cari nama atau RT..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {loading ? (
          <LoadingSpinner />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Search}
            title="Warga tidak ditemukan"
            action={<Button onClick={openAdd} size="sm"><Plus className="h-4 w-4" /> Tambah</Button>}
          />
        ) : (
          <div className="space-y-2">
            {filtered.map((w) => (
              <Card key={w.id} className="flex items-center justify-between" padding="sm">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900">{w.nama}</p>
                    <Badge variant={w.aktif !== false ? "green" : "gray"}>
                      {w.aktif !== false ? "Aktif" : "Nonaktif"}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500">
                    RT {w.rt} • {w.nomor_hp || "No HP"} • ID: {w.id}
                  </p>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => openEdit(w)}
                    className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => toggleAktif(w)}
                    className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                  >
                    {w.aktif !== false ? (
                      <UserX className="h-4 w-4" />
                    ) : (
                      <UserCheck className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editTarget ? "Edit Warga" : "Tambah Warga"}
      >
        <div className="space-y-4">
          <Input
            label="Nama Lengkap"
            value={form.nama}
            onChange={(e) => setForm({ ...form, nama: e.target.value })}
            placeholder="contoh: Budi Santoso"
            required
          />
          <Input
            label="RT"
            value={form.rt}
            onChange={(e) => setForm({ ...form, rt: e.target.value })}
            placeholder="contoh: 01"
            required
          />
          <Input
            label="Nomor HP"
            type="tel"
            value={form.nomor_hp}
            onChange={(e) => setForm({ ...form, nomor_hp: e.target.value })}
            placeholder="contoh: 08123456789"
          />
          <div className="flex gap-2 pt-2">
            <Button variant="outline" fullWidth onClick={() => setModalOpen(false)}>
              Batal
            </Button>
            <Button fullWidth loading={saving} onClick={handleSave}>
              {editTarget ? "Simpan" : "Tambah"}
            </Button>
          </div>
        </div>
      </Modal>
    </AdminLayout>
  );
}
