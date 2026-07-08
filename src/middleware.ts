import { NextRequest, NextResponse } from "next/server";

// Pages that require admin auth
const PROTECTED = ["/admin/dashboard", "/admin/warga", "/admin/setoran", "/admin/penjualan", "/admin/stok"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isProtected = PROTECTED.some((p) => pathname.startsWith(p));
  if (!isProtected) return NextResponse.next();

  const token = req.cookies.get("bs_admin_session")?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/admin", req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
