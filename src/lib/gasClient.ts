/**
 * gasClient.ts — Thin client untuk Google Apps Script Web App
 *
 * Semua komunikasi ke Google Sheets melewati satu fungsi `callGas()`.
 * Tidak ada logika bisnis di sini — hanya transport layer.
 */

import type { GasAction, GasResponse } from "@/types";

const GAS_URL = process.env.GOOGLE_SCRIPT_URL;

if (!GAS_URL && process.env.NODE_ENV === "production") {
  console.warn("[gasClient] GOOGLE_SCRIPT_URL is not set!");
}

// ─────────────────────────────────────────────────────────────
// Core fetch wrapper
// ─────────────────────────────────────────────────────────────

export async function callGas<T = unknown>(
  action: GasAction,
  payload?: Record<string, unknown>
): Promise<GasResponse<T>> {
  if (!GAS_URL) {
    // In development without GAS: return mock empty data
    console.warn(`[gasClient] No GAS_URL — returning empty for action: ${action}`);
    return { status: "success", data: undefined };
  }

  const body = JSON.stringify({ action, payload: payload ?? {} });

  const res = await fetch(GAS_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain" }, // GAS needs text/plain to avoid CORS preflight
    body,
    // Revalidate every 30s for GET-like actions in Next.js cache
    next: { revalidate: 30 },
  });

  if (!res.ok) {
    throw new Error(`GAS request failed: ${res.status} ${res.statusText}`);
  }

  const json: GasResponse<T> = await res.json();
  return json;
}

// ─────────────────────────────────────────────────────────────
// Force no-cache for mutations (POST actions that write data)
// ─────────────────────────────────────────────────────────────

export async function callGasMutation<T = unknown>(
  action: GasAction,
  payload?: Record<string, unknown>
): Promise<GasResponse<T>> {
  if (!GAS_URL) {
    console.warn(`[gasClient] No GAS_URL — skipping mutation: ${action}`);
    return { status: "success" };
  }

  const body = JSON.stringify({ action, payload: payload ?? {} });

  const res = await fetch(GAS_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body,
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`GAS mutation failed: ${res.status} ${res.statusText}`);
  }

  return res.json();
}
