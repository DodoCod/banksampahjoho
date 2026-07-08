import { callGas, callGasMutation } from "@/lib/gasClient";
import type { SaleBatch, SaleBatchInput, Distribusi, KasKarangTaruna, Saldo } from "@/types";

// ── Sale Batch ────────────────────────────────────────────────

export async function getSaleBatches(): Promise<SaleBatch[]> {
  const res = await callGas<SaleBatch[]>("getSaleBatches");
  return res.data ?? [];
}

export async function addSaleBatch(input: SaleBatchInput): Promise<{ id: string }> {
  const payload = {
    ...input,
    collection_batch_ids: input.collection_batch_ids.join(","),
  };
  const res = await callGasMutation<{ id: string }>("addSaleBatch", payload);
  if (res.status !== "success" || !res.data) {
    throw new Error(res.message ?? "Gagal menyimpan penjualan");
  }
  return res.data;
}

// ── Distribusi ────────────────────────────────────────────────

export async function getDistribusiBySale(saleId: string): Promise<Distribusi[]> {
  const res = await callGas<Distribusi[]>("getDistribusi", { sale_id: saleId });
  return res.data ?? [];
}

export async function getAllDistribusi(): Promise<Distribusi[]> {
  const res = await callGas<Distribusi[]>("getDistribusi");
  return res.data ?? [];
}

// ── Saldo ─────────────────────────────────────────────────────

export async function getAllSaldo(): Promise<Saldo[]> {
  const res = await callGas<Saldo[]>("getSaldo");
  return res.data ?? [];
}

export async function getSaldoByWarga(wargaId: string): Promise<number> {
  const all = await getAllSaldo();
  return all.find((s) => s.warga_id === wargaId)?.total_saldo ?? 0;
}

// ── Kas Karang Taruna ─────────────────────────────────────────

export async function getKasKarangTaruna(): Promise<KasKarangTaruna[]> {
  const res = await callGas<KasKarangTaruna[]>("getKasKarangTaruna");
  return res.data ?? [];
}

export async function getTotalKas(): Promise<number> {
  const kas = await getKasKarangTaruna();
  return kas.reduce((sum, k) => sum + k.nominal, 0);
}
