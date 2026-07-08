// ============================================================
// DOMAIN TYPES — Bank Sampah
// ============================================================

export interface Warga {
  id: string;
  nama: string;
  rt: string;
  nomor_hp: string;
  aktif: boolean;
  created_at: string;
}

export interface CollectionBatch {
  id: string;       // e.g. C001
  tanggal: string;  // ISO date
  status: "pending" | "sold";
  total_kg?: number; // computed from setoran
}

export interface Setoran {
  id: string;
  batch_id: string;
  warga_id: string;
  berat_kg: number;
  // joined
  warga_nama?: string;
  warga_rt?: string;
}

export interface SaleBatch {
  id: string;         // e.g. P001
  tanggal_jual: string;
  collection_batch_ids: string; // comma-separated "C001,C002"
  total_kg: number;
  total_penjualan: number;
  harga_per_kg: number;
  nota_url: string;
}

export interface Distribusi {
  id: string;
  sale_id: string;
  warga_id: string;
  berat: number;
  persentase: number;
  saldo: number;
  // joined
  warga_nama?: string;
  warga_rt?: string;
}

export interface KasKarangTaruna {
  id: string;
  sale_id: string;
  nominal: number;
}

export interface Saldo {
  warga_id: string;
  total_saldo: number;
  warga_nama?: string;
  warga_rt?: string;
}

// ============================================================
// API RESPONSE TYPES
// ============================================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface DashboardStats {
  total_warga: number;
  total_sampah_kg: number;
  total_penjualan: number;
  total_kas_karang_taruna: number;
  total_saldo_warga: number;
  batch_pending_count: number;
  last_updated: string;
}

export interface WargaDetail {
  warga: Warga;
  saldo: number;
  total_setoran_kg: number;
  riwayat_setoran: Setoran[];
  riwayat_distribusi: Distribusi[];
}

// ============================================================
// FORM INPUT TYPES
// ============================================================

export type WargaInput = Omit<Warga, "id" | "created_at" | "aktif">;

export interface SetoranInput {
  batch_id: string;
  warga_id: string;
  berat_kg: number;
}

export interface SaleBatchInput {
  collection_batch_ids: string[];
  total_kg: number;
  total_penjualan: number;
  nota_url: string;
}

export interface LoginInput {
  password: string;
}

// ============================================================
// GOOGLE APPS SCRIPT PROXY TYPES
// ============================================================

export type GasAction =
  | "getWarga"
  | "addWarga"
  | "updateWarga"
  | "getCollectionBatches"
  | "addCollectionBatch"
  | "getSetoran"
  | "addSetoran"
  | "deleteSetoran"
  | "getSaleBatches"
  | "addSaleBatch"
  | "getDistribusi"
  | "getSaldo"
  | "getKasKarangTaruna"
  | "getDashboardStats"
  | "getWargaDetail"
  | "archiveOldTransactions";

export interface GasRequest {
  action: GasAction;
  payload?: Record<string, unknown>;
}

export interface GasResponse<T = unknown> {
  status: "success" | "error";
  data?: T;
  message?: string;
}
