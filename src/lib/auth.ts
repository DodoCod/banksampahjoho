/**
 * auth.ts — Simple password-based admin auth
 *
 * Menggunakan signed cookie (HMAC-SHA256) agar tidak perlu JWT library.
 * Tidak ada user management — hanya satu password admin dari env.
 */

import { cookies } from "next/headers";
import { createHmac } from "crypto";

const SECRET = process.env.AUTH_SECRET ?? "dev-secret-min-32-chars-xxxxxxxxxxxx";
const COOKIE_NAME = "bs_admin_session";
const SESSION_MAX_AGE = 60 * 60 * 8; // 8 jam

// ── Sign a value ─────────────────────────────────────────────
function sign(value: string): string {
  const hmac = createHmac("sha256", SECRET);
  hmac.update(value);
  return value + "." + hmac.digest("hex");
}

// ── Verify and unsign ─────────────────────────────────────────
function unsign(signed: string): string | false {
  const lastDot = signed.lastIndexOf(".");
  if (lastDot === -1) return false;
  const value = signed.slice(0, lastDot);
  const expected = sign(value);
  return signed === expected ? value : false;
}

// ── Create session cookie after login ─────────────────────────
export function createSession(): void {
  const payload = `admin:${Date.now()}`;
  const cookieStore = cookies();
  cookieStore.set(COOKIE_NAME, sign(payload), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });
}

// ── Delete session cookie on logout ──────────────────────────
export function deleteSession(): void {
  cookies().delete(COOKIE_NAME);
}

// ── Check if the current request is authenticated ────────────
export function isAuthenticated(): boolean {
  const cookieStore = cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return false;
  const value = unsign(token);
  if (!value) return false;
  // Check the session is not expired (8h)
  const ts = parseInt(value.split(":")[1] ?? "0", 10);
  return Date.now() - ts < SESSION_MAX_AGE * 1000;
}

// ── Verify admin password ─────────────────────────────────────
export function verifyPassword(input: string): boolean {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    console.error("[auth] ADMIN_PASSWORD env var is not set!");
    return false;
  }
  // Constant-time comparison
  const a = Buffer.from(input.padEnd(64));
  const b = Buffer.from(adminPassword.padEnd(64));
  return a.length === b.length && a.every((byte, i) => byte === b[i]);
}
