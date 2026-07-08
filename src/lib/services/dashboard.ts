import { callGas } from "@/lib/gasClient";
import type { DashboardStats } from "@/types";

export async function getDashboardStats(): Promise<DashboardStats> {
  const res = await callGas<DashboardStats>("getDashboardStats");
  return (
    res.data ?? {
      total_warga: 0,
      total_sampah_kg: 0,
      total_penjualan: 0,
      total_kas_karang_taruna: 0,
      total_saldo_warga: 0,
      batch_pending_count: 0,
      last_updated: new Date().toISOString(),
    }
  );
}
