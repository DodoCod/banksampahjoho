import { callGas, callGasMutation } from "@/lib/gasClient";
import type { CollectionBatch, Setoran, SetoranInput } from "@/types";

// ── Collection Batch ──────────────────────────────────────────

export async function getCollectionBatches(): Promise<CollectionBatch[]> {
  const res = await callGas<CollectionBatch[]>("getCollectionBatches");
  return res.data ?? [];
}

export async function getPendingBatches(): Promise<CollectionBatch[]> {
  const batches = await getCollectionBatches();
  return batches.filter((b) => b.status === "pending");
}

export async function addCollectionBatch(tanggal: string): Promise<{ id: string }> {
  const res = await callGasMutation<{ id: string }>("addCollectionBatch", { tanggal });
  if (res.status !== "success" || !res.data) {
    throw new Error(res.message ?? "Gagal membuat batch");
  }
  return res.data;
}

// ── Setoran ───────────────────────────────────────────────────

export async function getSetoranByBatch(batchId: string): Promise<Setoran[]> {
  const res = await callGas<Setoran[]>("getSetoran", { batch_id: batchId });
  return res.data ?? [];
}

export async function addSetoran(input: SetoranInput): Promise<{ id: string }> {
  const res = await callGasMutation<{ id: string }>("addSetoran", { ...input });
  if (res.status !== "success" || !res.data) {
    throw new Error(res.message ?? "Gagal menyimpan setoran");
  }
  return res.data;
}

export async function deleteSetoran(id: string): Promise<void> {
  const res = await callGasMutation("deleteSetoran", { id });
  if (res.status !== "success") {
    throw new Error(res.message ?? "Gagal menghapus setoran");
  }
}
