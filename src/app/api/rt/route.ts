import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { callGas, callGasMutation } from "@/lib/gasClient";

export interface RT {
  id: string;
  nama: string;
}

export async function GET() {
  try {
    const res = await callGas<RT[]>("getRt");
    return NextResponse.json({ success: true, data: res.data ?? [] });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!isAuthenticated()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { nama } = await req.json();
    if (!nama) {
      return NextResponse.json({ error: "Nama RT wajib diisi" }, { status: 400 });
    }
    const res = await callGasMutation<{ id: string; nama: string }>("addRt", { nama });
    if (res.status !== "success") throw new Error(res.message);
    return NextResponse.json({ success: true, data: res.data }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  if (!isAuthenticated()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { id, nama } = await req.json();
    if (!id || !nama) {
      return NextResponse.json({ error: "ID dan nama RT wajib diisi" }, { status: 400 });
    }
    const res = await callGasMutation("updateRt", { id, nama });
    if (res.status !== "success") throw new Error(res.message);
    return NextResponse.json({ success: true });
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
    if (!id) {
      return NextResponse.json({ error: "ID RT wajib diisi" }, { status: 400 });
    }
    const res = await callGasMutation("deleteRt", { id });
    if (res.status !== "success") throw new Error(res.message);
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
