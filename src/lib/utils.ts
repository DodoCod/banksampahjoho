import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// ── Tailwind class merger ────────────────────────────────────
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ── Currency formatter (IDR) ─────────────────────────────────
export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// ── Weight formatter ─────────────────────────────────────────
export function formatKg(kg: number): string {
  return `${kg.toLocaleString("id-ID", { maximumFractionDigits: 2 })} kg`;
}

// ── Date formatter ───────────────────────────────────────────
export function formatDate(dateStr: string): string {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatDateShort(dateStr: string): string {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return d.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// ── Phone number formatter ───────────────────────────────────
export function formatPhone(phone: string): string {
  if (!phone) return "-";
  // Convert 08xx to +628xx
  if (phone.startsWith("08")) return "+62" + phone.slice(1);
  return phone;
}

// ── Generate next ID ─────────────────────────────────────────
export function generateBatchId(prefix: "C" | "P", existingIds: string[]): string {
  const nums = existingIds
    .filter((id) => id.startsWith(prefix))
    .map((id) => parseInt(id.slice(1), 10))
    .filter((n) => !isNaN(n));
  const next = nums.length > 0 ? Math.max(...nums) + 1 : 1;
  return `${prefix}${String(next).padStart(3, "0")}`;
}

// ── Percentage calculation ────────────────────────────────────
export function calcPersentase(wargaKg: number, totalKg: number): number {
  if (totalKg === 0) return 0;
  return Math.round((wargaKg / totalKg) * 10000) / 100; // 2 decimal places
}

// ── Saldo calculation (50% dibagi proporsional) ───────────────
export function calcSaldo(wargaKg: number, totalKg: number, totalPenjualan: number): number {
  if (totalKg === 0) return 0;
  const danaWarga = totalPenjualan * 0.5;
  return Math.round((wargaKg / totalKg) * danaWarga);
}

// ── Truncate text ─────────────────────────────────────────────
export function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen) + "…";
}

// ── Today's ISO date string ───────────────────────────────────
export function todayISO(): string {
  return new Date().toISOString().split("T")[0];
}

// ── Parse comma-separated batch IDs ──────────────────────────
export function parseBatchIds(str: string): string[] {
  return str
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}
