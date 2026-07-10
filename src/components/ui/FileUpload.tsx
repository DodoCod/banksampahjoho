"use client";
import { useRef, useState } from "react";
import { Camera, Upload, X, FileImage, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

interface FileUploadProps {
  value?: string;        // URL yang sudah tersimpan
  onChange: (url: string, thumbUrl?: string) => void;
  disabled?: boolean;
}

export function FileUpload({ value, onChange, disabled }: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview]     = useState<string | null>(null);
  const fileInputRef              = useRef<HTMLInputElement>(null);
  const cameraInputRef            = useRef<HTMLInputElement>(null);

  // ── Convert file → base64 ──────────────────────────────────
  function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload  = () => {
        const result = reader.result as string;
        // Hapus prefix "data:image/jpeg;base64," → ambil base64 murni
        resolve(result.split(",")[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // ── Upload ke GAS → Google Drive ──────────────────────────
  async function handleFile(file: File) {
    // Validasi tipe file
    const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!allowed.includes(file.type)) {
      toast.error("Hanya JPG, PNG, WEBP, atau PDF yang diizinkan");
      return;
    }

    // Validasi ukuran (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ukuran file maksimal 5MB");
      return;
    }

    // Tampil preview lokal dulu
    const localUrl = URL.createObjectURL(file);
    setPreview(localUrl);
    setUploading(true);

    try {
      const base64   = await fileToBase64(file);
      const fileName = `nota-${Date.now()}.${file.name.split(".").pop()}`;

      const res = await fetch("/api/upload", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          base64,
          mimeType: file.type,
          fileName,
        }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      onChange(data.url, data.thumb);
      toast.success("Nota berhasil diupload!");
    } catch (e) {
      toast.error("Upload gagal: " + String(e));
      setPreview(null);
    } finally {
      setUploading(false);
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    // Reset input agar file yang sama bisa dipilih lagi
    e.target.value = "";
  }

  function handleRemove() {
    setPreview(null);
    onChange("", "");
  }

  // ── Sudah ada file / preview ───────────────────────────────
  const displayUrl = preview || value;

  if (displayUrl) {
    return (
      <div className="relative">
        <p className="mb-1.5 text-sm font-medium text-gray-700">Foto Nota</p>
        <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
          {/* Preview gambar */}
          {displayUrl.match(/\.(jpg|jpeg|png|webp)$/i) ||
           displayUrl.includes("drive.google.com") ||
           preview ? (
            <img
              src={displayUrl}
              alt="Preview nota"
              className="h-40 w-full object-cover"
              onError={(e) => {
                // Fallback kalau gambar tidak bisa load
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          ) : (
            <div className="flex h-24 items-center justify-center gap-2 text-gray-500">
              <FileImage className="h-6 w-6" />
              <span className="text-sm">File terlampir</span>
            </div>
          )}

          {/* Overlay loading */}
          {uploading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/50">
              <Loader2 className="h-6 w-6 animate-spin text-white" />
              <span className="text-xs text-white">Mengupload...</span>
            </div>
          )}

          {/* Tombol hapus */}
          {!uploading && (
            <button
              type="button"
              onClick={handleRemove}
              disabled={disabled}
              className="absolute right-2 top-2 rounded-full bg-red-500 p-1 text-white shadow hover:bg-red-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Link ke Drive kalau sudah terupload */}
        {value && !uploading && (
          <a
            href={value}
            target="_blank"
            rel="noreferrer"
            className="mt-1 inline-block text-xs text-blue-600 hover:underline"
          >
            Lihat di Google Drive →
          </a>
        )}
      </div>
    );
  }

  // ── Belum ada file — tampil picker ────────────────────────
  return (
    <div>
      <p className="mb-1.5 text-sm font-medium text-gray-700">
        Foto Nota <span className="text-gray-400">(opsional)</span>
      </p>

      {/* Hidden inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,application/pdf"
        className="hidden"
        onChange={handleInputChange}
        disabled={disabled}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"   // buka kamera belakang langsung
        className="hidden"
        onChange={handleInputChange}
        disabled={disabled}
      />

      {/* Tombol pilihan */}
      <div className="grid grid-cols-2 gap-2">
        {/* Kamera — untuk HP */}
        <button
          type="button"
          disabled={disabled || uploading}
          onClick={() => cameraInputRef.current?.click()}
          className={cn(
            "flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-gray-300",
            "py-4 text-gray-500 transition-colors",
            "hover:border-brand-400 hover:bg-brand-50 hover:text-brand-700",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          <Camera className="h-6 w-6" />
          <span className="text-xs font-medium">Foto Kamera</span>
        </button>

        {/* File picker — untuk desktop / galeri */}
        <button
          type="button"
          disabled={disabled || uploading}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-gray-300",
            "py-4 text-gray-500 transition-colors",
            "hover:border-brand-400 hover:bg-brand-50 hover:text-brand-700",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          <Upload className="h-6 w-6" />
          <span className="text-xs font-medium">Pilih File</span>
        </button>
      </div>

      <p className="mt-1.5 text-xs text-gray-400">
        JPG, PNG, atau PDF • Maks. 5MB
      </p>
    </div>
  );
}
