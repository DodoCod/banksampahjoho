import { NextResponse } from "next/server";
import { getDashboardStats } from "@/lib/services/dashboard";

export async function GET() {
  try {
    const stats = await getDashboardStats();
    return NextResponse.json({ success: true, data: stats });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
