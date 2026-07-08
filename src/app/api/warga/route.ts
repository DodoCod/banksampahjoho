import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { getAllWarga, addWarga } from "@/lib/services/warga";

export async function GET() {
  try {
    const warga = await getAllWarga();
    return NextResponse.json({ success: true, data: warga });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!isAuthenticated()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await req.json();
    const { nama, rt, nomor_hp } = body;
    if (!nama || !rt) {
      return NextResponse.json({ error: "Nama dan RT wajib diisi" }, { status: 400 });
    }
    const result = await addWarga({ nama, rt, nomor_hp: nomor_hp ?? "" });
    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
