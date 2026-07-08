import { callGas, callGasMutation } from "@/lib/gasClient";
import type { Warga, WargaInput, WargaDetail } from "@/types";

export async function getAllWarga(): Promise<Warga[]> {
  const res = await callGas<Warga[]>("getWarga");
  return res.data ?? [];
}

export async function getActiveWarga(): Promise<Warga[]> {
  const all = await getAllWarga();
  return all.filter((w) => w.aktif !== false);
}

export async function addWarga(input: WargaInput): Promise<{ id: string }> {
  const res = await callGasMutation<{ id: string }>("addWarga", { ...input });
  if (res.status !== "success" || !res.data) {
    throw new Error(res.message ?? "Gagal menambahkan warga");
  }
  return res.data;
}

export async function updateWarga(
  id: string,
  input: Partial<WargaInput & { aktif: boolean }>
): Promise<void> {
  const res = await callGasMutation("updateWarga", { id, ...input });
  if (res.status !== "success") {
    throw new Error(res.message ?? "Gagal mengupdate warga");
  }
}

export async function getWargaDetail(wargaId: string): Promise<WargaDetail | null> {
  const res = await callGas<WargaDetail>("getWargaDetail", { warga_id: wargaId });
  return res.data ?? null;
}
