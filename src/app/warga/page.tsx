"use client";
import { useState } from "react";
import Link from "next/link";
import { Search, ArrowLeft, User, Coins } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { LoadingSpinner } from "@/components/ui/Feedback";
import { formatRupiah, formatKg } from "@/lib/utils";
import type { Warga } from "@/types";

export default function WargaSearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<(Warga & { total_saldo: number; total_kg: number })[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  async function handleSearch(q: string) {
    setQuery(q);
    if (q.trim().length < 2) {
      setResults([]);
      setSearched(false);
      return;
    }
    setLoading(true);
    setSearched(true);
    try {
      const [wargaRes, saldoRes] = await Promise.all([
        fetch("/api/warga").then((r) => r.json()),
        fetch("/api/saldo").then((r) => r.json()),
      ]);
      const allWarga: Warga[] = wargaRes.data ?? [];
      const allSaldo: { warga_id: string; total_saldo: number }[] = saldoRes.data ?? [];

      const filtered = allWarga
        .filter(
          (w) =>
            w.aktif !== false &&
            (w.nama.toLowerCase().includes(q.toLowerCase()) ||
              w.rt.toLowerCase().includes(q.toLowerCase()))
        )
        .map((w) => ({
          ...w,
          total_saldo: allSaldo.find((s) => s.warga_id === w.id)?.total_saldo ?? 0,
          total_kg: 0,
        }));
      setResults(filtered);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="mx-auto max-w-lg flex items-center gap-3">
          <Link href="/" className="text-gray-500 hover:text-gray-700">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-base font-bold text-gray-900">Cek Saldo Warga</h1>
            <p className="text-xs text-gray-500">Cari nama atau RT</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 py-4">
        <Input
          placeholder="Cari nama atau RT..."
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          className="mb-4"
        />

        {loading && <LoadingSpinner />}

        {!loading && searched && results.length === 0 && (
          <div className="py-8 text-center text-gray-500">
            <User className="mx-auto h-10 w-10 text-gray-300 mb-2" />
            <p className="text-sm">Warga tidak ditemukan</p>
          </div>
        )}

        <div className="space-y-3">
          {results.map((w) => (
            <Card key={w.id} className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-900">{w.nama}</p>
                <p className="text-xs text-gray-500">RT {w.rt} • {w.nomor_hp || "No HP tidak ada"}</p>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1 text-brand-700">
                  <Coins className="h-4 w-4" />
                  <span className="font-bold text-sm">{formatRupiah(w.total_saldo)}</span>
                </div>
                <p className="text-xs text-gray-500">saldo</p>
              </div>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
