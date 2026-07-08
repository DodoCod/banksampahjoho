import { NextRequest, NextResponse } from "next/server";
import { getAllSaldo } from "@/lib/services/penjualan";

export async function GET(req: NextRequest) {
  try {
    const wargaId = req.nextUrl.searchParams.get("warga_id");
    const allSaldo = await getAllSaldo();
    if (wargaId) {
      const saldo = allSaldo.find((s) => s.warga_id === wargaId);
      return NextResponse.json({ success: true, data: saldo ?? null });
    }
    return NextResponse.json({ success: true, data: allSaldo });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
