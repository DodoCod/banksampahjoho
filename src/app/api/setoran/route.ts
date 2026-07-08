import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { getSetoranByBatch, addSetoran, deleteSetoran } from "@/lib/services/setoran";

export async function GET(req: NextRequest) {
  try {
    const batchId = req.nextUrl.searchParams.get("batch_id");
    if (!batchId) {
      return NextResponse.json({ error: "batch_id diperlukan" }, { status: 400 });
    }
    const setoran = await getSetoranByBatch(batchId);
    return NextResponse.json({ success: true, data: setoran });
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
    const { batch_id, warga_id, berat_kg } = body;
    if (!batch_id || !warga_id || !berat_kg) {
      return NextResponse.json({ error: "Semua field wajib diisi" }, { status: 400 });
    }
    const result = await addSetoran({ batch_id, warga_id, berat_kg: Number(berat_kg) });
    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!isAuthenticated()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: "ID diperlukan" }, { status: 400 });
    await deleteSetoran(id);
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
