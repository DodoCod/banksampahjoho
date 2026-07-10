import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { callGasMutation } from "@/lib/gasClient";

export async function POST(req: NextRequest) {
  // Hanya admin yang boleh upload
  if (!isAuthenticated()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { base64, mimeType, fileName } = body;

    if (!base64 || !mimeType || !fileName) {
      return NextResponse.json(
        { error: "Data tidak lengkap (base64, mimeType, fileName diperlukan)" },
        { status: 400 }
      );
    }

    // Kirim ke GAS untuk disimpan ke Google Drive
    const result = await callGasMutation<{
      url: string;
      thumb: string;
      fileId: string;
      fileName: string;
    }>("uploadFile", { base64, mimeType, fileName });

    if (result.status !== "success" || !result.data) {
      throw new Error(result.message ?? "Upload ke Google Drive gagal");
    }

    return NextResponse.json({
      success: true,
      url:     result.data.url,
      thumb:   result.data.thumb,
      fileId:  result.data.fileId,
    });
  } catch (e) {
    console.error("[upload]", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
