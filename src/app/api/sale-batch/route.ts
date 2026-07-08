import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { getSaleBatches, addSaleBatch } from "@/lib/services/penjualan";

export async function GET() {
  try {
    const sales = await getSaleBatches();
    return NextResponse.json({ success: true, data: sales });
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
    const { collection_batch_ids, total_kg, total_penjualan, nota_url } = body;
    if (!collection_batch_ids?.length || !total_kg || !total_penjualan) {
      return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
    }
    const result = await addSaleBatch({
      collection_batch_ids,
      total_kg: Number(total_kg),
      total_penjualan: Number(total_penjualan),
      nota_url: nota_url ?? "",
    });
    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
