import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { getCollectionBatches, addCollectionBatch } from "@/lib/services/setoran";

export async function GET() {
  try {
    const batches = await getCollectionBatches();
    return NextResponse.json({ success: true, data: batches });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!isAuthenticated()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { tanggal } = await req.json();
    if (!tanggal) {
      return NextResponse.json({ error: "Tanggal wajib diisi" }, { status: 400 });
    }
    const result = await addCollectionBatch(tanggal);
    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
