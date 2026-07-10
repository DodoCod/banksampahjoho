"use client";
import { useState, useEffect } from "react";
import {
  Plus, Search, UserCheck, UserX, Pencil,
  MapPin, Trash2, AlertTriangle, Info,
} from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { PageHeader } from "@/components/admin/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { LoadingSpinner, EmptyState } from "@/components/ui/Feedback";
import type { Warga } from "@/types";
import toast from "react-hot-toast";

interface RT { id: string; nama: string; }

// ── Komponen Select RT dengan opsi "Tambah RT Baru..." ────────
function RtSelect({
  value,
  onChange,
  rtList,
  onAddNew,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  rtList: RT[];
  onAddNew: () => void;
  disabled?: boolean;
}) {
  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    if (e.target.value === "__add_new__") {
      onAddNew();
      return;
    }
    onChange(e.target.value);
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-gray-700">
        RT <span className="text-red-500">*</span>
      </label>
      <select
        value={value}
        onChange={handleChange}
        disabled={disabled}
        className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:bg-gray-50"
      >
        <option value="" disabled>Pilih RT...</option>
        {rtList.map((rt) => (
          <option key={rt.id} value={rt.nama}>{rt.nama}</option>
        ))}
        <option value="__add_new__">➕ Tambah RT Baru...</option>
      </select>
    </div>
  );
}

// ── Modal Tambah RT Baru (inline, bisa dipanggil dari select) ─
function TambahRtModal({
  open,
  onClose,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: (rt: RT) => void;
}) {
  const [nama, setNama]       = useState("");
  const [saving, setSaving]   = useState(false);

  async function handleSave() {
    if (!nama.trim()) { toast.error("Nama RT wajib diisi"); return; }
    setSaving(true);
    try {
      const res  = await fetch("/api/rt", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ nama: nama.trim() }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast.success(`${data.data.nama} berhasil ditambahkan`);
      onSuccess(data.data);
      setNama("");
      onClose();
    } catch (e) {
      toast.error(String(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Tambah RT Baru" size="sm">
      <div className="space-y-4">
        {/* Warning format */}
        <div className="flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3">
          <Info className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-blue-700">
            <p className="font-semibold mb-1">Format penulisan RT:</p>
            <p>Gunakan format <span className="font-mono font-bold">RT XX</span> dengan 2 digit angka.</p>
            <p className="mt-1">Contoh yang benar:</p>
            <ul className="list-disc list-inside mt-0.5 space-y-0.5">
              <li><span className="font-mono">RT 01</span></li>
              <li><span className="font-mono">RT 02</span></li>
              <li><span className="font-mono">RT 10</span></li>
            </ul>
            <p className="mt-1 text-blue-600">❌ Jangan: "rt01", "RT1", "RT-01", "01"</p>
          </div>
        </div>

        <Input
          label="Nama RT"
          value={nama}
          onChange={(e) => setNama(e.target.value)}
          placeholder="contoh: RT 01"
          required
          autoFocus
          onKeyDown={(e) => { if (e.key === "Enter") handleSave(); }}
        />

        <div className="flex gap-2 pt-1">
          <Button variant="outline" fullWidth onClick={onClose} disabled={saving}>Batal</Button>
          <Button fullWidth loading={saving} onClick={handleSave}>Tambah RT</Button>
        </div>
      </div>
    </Modal>
  );
}

// ── Modal Kelola RT (CRUD list) ───────────────────────────────
function KelolaRtModal({
  open,
  onClose,
  rtList,
  onRtChange,
}: {
  open: boolean;
  onClose: () => void;
  rtList: RT[];
  onRtChange: () => void;
}) {
  const [editTarget, setEditTarget] = useState<RT | null>(null);
  const [editNama, setEditNama]     = useState("");
  const [saving, setSaving]         = useState(false);
  const [deleting, setDeleting]     = useState<string | null>(null);
  const [tambahOpen, setTambahOpen] = useState(false);

  function startEdit(rt: RT) {
    setEditTarget(rt);
    setEditNama(rt.nama);
  }

  function cancelEdit() {
    setEditTarget(null);
    setEditNama("");
  }

  async function handleUpdate() {
    if (!editTarget || !editNama.trim()) return;
    setSaving(true);
    try {
      const res  = await fetch("/api/rt", {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ id: editTarget.id, nama: editNama.trim() }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast.success("RT berhasil diperbarui");
      cancelEdit();
      onRtChange();
    } catch (e) {
      toast.error(String(e));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(rt: RT) {
    setDeleting(rt.id);
    try {
      const res  = await fetch("/api/rt", {
        method:  "DELETE",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ id: rt.id }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast.success(`${rt.nama} berhasil dihapus`);
      onRtChange();
    } catch (e) {
      toast.error(String(e));
    } finally {
      setDeleting(null);
    }
  }

  return (
    <>
      <Modal open={open} onClose={onClose} title="Kelola RT" size="md">
        <div className="space-y-3">
          <Button
            size="sm"
            onClick={() => setTambahOpen(true)}
            className="w-full"
          >
            <Plus className="h-4 w-4" /> Tambah RT Baru
          </Button>

          {rtList.length === 0 ? (
            <EmptyState
              icon={MapPin}
              title="Belum ada RT"
              description="Tambah RT terlebih dahulu"
            />
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {rtList.map((rt) => (
                <div
                  key={rt.id}
                  className="rounded-lg border border-gray-200 bg-gray-50 p-3"
                >
                  {editTarget?.id === rt.id ? (
                    // Mode edit inline
                    <div className="space-y-2">
                      {/* Warning format saat edit */}
                      <div className="flex items-center gap-1.5 text-xs text-blue-600">
                        <Info className="h-3.5 w-3.5 flex-shrink-0" />
                        Format: <span className="font-mono font-semibold">RT XX</span> (contoh: RT 01)
                      </div>
                      <Input
                        value={editNama}
                        onChange={(e) => setEditNama(e.target.value)}
                        placeholder="RT 01"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleUpdate();
                          if (e.key === "Escape") cancelEdit();
                        }}
                      />
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" fullWidth onClick={cancelEdit} disabled={saving}>
                          Batal
                        </Button>
                        <Button size="sm" fullWidth loading={saving} onClick={handleUpdate}>
                          Simpan
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // Mode tampil
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-brand-600" />
                        <span className="font-medium text-gray-900">{rt.nama}</span>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => startEdit(rt)}
                          className="rounded-lg p-1.5 text-gray-400 hover:bg-white hover:text-brand-600"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(rt)}
                          disabled={deleting === rt.id}
                          className="rounded-lg p-1.5 text-gray-400 hover:bg-white hover:text-red-600 disabled:opacity-50"
                        >
                          {deleting === rt.id ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-300 border-t-red-600" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Info hapus */}
          <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
            <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700">
              RT tidak dapat dihapus jika masih ada warga aktif yang terdaftar di RT tersebut.
            </p>
          </div>

          <Button variant="outline" fullWidth onClick={onClose}>Tutup</Button>
        </div>
      </Modal>

      {/* Modal tambah RT dari dalam kelola RT */}
      <TambahRtModal
        open={tambahOpen}
        onClose={() => setTambahOpen(false)}
        onSuccess={() => { onRtChange(); }}
      />
    </>
  );
}

// ── Halaman Utama Warga ───────────────────────────────────────
export default function AdminWargaPage() {
  const [warga, setWarga]           = useState<Warga[]>([]);
  const [rtList, setRtList]         = useState<RT[]>([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [modalOpen, setModalOpen]   = useState(false);
  const [kelolaRtOpen, setKelolaRtOpen] = useState(false);
  const [tambahRtOpen, setTambahRtOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Warga | null>(null);
  const [saving, setSaving]         = useState(false);
  const [form, setForm]             = useState({ nama: "", rt: "", nomor_hp: "" });

  async function loadWarga() {
    setLoading(true);
    try {
      const [wRes, rRes] = await Promise.all([
        fetch("/api/warga").then((r) => r.json()),
        fetch("/api/rt").then((r) => r.json()),
      ]);
      setWarga(wRes.data ?? []);
      setRtList(rRes.data ?? []);
    } catch {
      toast.error("Gagal memuat data");
    } finally {
      setLoading(false);
    }
  }

  async function loadRt() {
    const res  = await fetch("/api/rt").then((r) => r.json());
    setRtList(res.data ?? []);
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
    if (!form.nama.trim()) { toast.error("Nama wajib diisi"); return; }
    if (!form.rt)          { toast.error("RT wajib dipilih"); return; }
    setSaving(true);
    try {
      if (editTarget) {
        const res  = await fetch(`/api/warga/${editTarget.id}`, {
          method:  "PATCH",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify(form),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error);
        toast.success("Data warga diperbarui");
      } else {
        const res  = await fetch("/api/warga", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify(form),
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
      const res  = await fetch(`/api/warga/${w.id}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ aktif: !w.aktif }),
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
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setKelolaRtOpen(true)}
            >
              <MapPin className="h-4 w-4" /> Kelola RT
            </Button>
            <Button size="sm" onClick={openAdd}>
              <Plus className="h-4 w-4" /> Tambah Warga
            </Button>
          </div>
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
            action={
              <Button onClick={openAdd} size="sm">
                <Plus className="h-4 w-4" /> Tambah
              </Button>
            }
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
                    {w.rt} • {w.nomor_hp || "No HP"} • ID: {w.id}
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

      {/* ── Modal Tambah/Edit Warga ── */}
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

          {/* Select RT dengan opsi tambah baru */}
          <RtSelect
            value={form.rt}
            onChange={(v) => setForm({ ...form, rt: v })}
            rtList={rtList}
            disabled={saving}
            onAddNew={() => {
              // Simpan state form dulu, buka modal tambah RT
              setTambahRtOpen(true);
            }}
          />

          {rtList.length === 0 && (
            <p className="text-xs text-amber-600">
              ⚠️ Belum ada RT terdaftar. Tambah RT terlebih dahulu melalui tombol "Kelola RT".
            </p>
          )}

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

      {/* ── Modal Kelola RT ── */}
      <KelolaRtModal
        open={kelolaRtOpen}
        onClose={() => setKelolaRtOpen(false)}
        rtList={rtList}
        onRtChange={loadRt}
      />

      {/* ── Modal Tambah RT dari Select ── */}
      <TambahRtModal
        open={tambahRtOpen}
        onClose={() => setTambahRtOpen(false)}
        onSuccess={(newRt) => {
          // Tambah ke list lokal & pilih otomatis
          setRtList((prev) => [...prev, newRt].sort((a, b) => a.nama.localeCompare(b.nama)));
          setForm((f) => ({ ...f, rt: newRt.nama }));
        }}
      />
    </AdminLayout>
  );
}
