import { NextRequest, NextResponse } from "next/server";
import { verifyPassword, createSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json();
    if (!password || typeof password !== "string") {
      return NextResponse.json({ error: "Password diperlukan" }, { status: 400 });
    }
    if (!verifyPassword(password)) {
      return NextResponse.json({ error: "Password salah" }, { status: 401 });
    }
    createSession();
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Terjadi kesalahan" }, { status: 500 });
  }
}
