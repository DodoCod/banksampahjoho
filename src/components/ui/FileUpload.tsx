"use client";
import { forwardRef, useImperativeHandle, useRef, useState, useEffect } from "react";
import { Camera, Upload, X, FileImage, Loader2, Maximize2, Minimize2 } from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

// ==========================================
// 1. INTERFACE & HANDLING FILE UPLOAD
// ==========================================
export interface FileUploadHandle {
  upload: () => Promise<{ url: string; thumb: string } | null>;
  hasPendingFile: () => boolean;
}

interface FileUploadProps {
  value?: string;
  onChange: (url: string, thumbUrl?: string) => void;
  disabled?: boolean;
}

// Komponen FileUpload dengan Fitur Strict Fullscreen Preview
export const FileUpload = forwardRef<FileUploadHandle, FileUploadProps>(
  function FileUpload({ value, onChange, disabled }, ref) {
    const [uploading, setUploading]     = useState(false);
    const [preview, setPreview]         = useState<string | null>(null);
    const [pendingFile, setPendingFile] = useState<File | null>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const fileInputRef                  = useRef<HTMLInputElement>(null);
    const cameraInputRef                = useRef<HTMLInputElement>(null);

    // Kunci scroll halaman saat modal fullscreen aktif
    useEffect(() => {
      if (isFullscreen) {
        document.body.style.overflow = "hidden";
      } else {
        document.body.style.overflow = "unset";
      }
      return () => {
        document.body.style.overflow = "unset";
      };
    }, [isFullscreen]);

    function fileToBase64(file: File): Promise<string> {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload  = () => {
          const result = reader.result as string;
          resolve(result.split(",")[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    }

    async function doUpload(file: File): Promise<{ url: string; thumb: string } | null> {
      setUploading(true);
      try {
        const base64   = await fileToBase64(file);
        const fileName = `nota-${Date.now()}.${file.name.split(".").pop()}`;

        const res = await fetch("/api/upload", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ base64, mimeType: file.type, fileName }),
        });

        const data = await res.json();
        if (!data.success) throw new Error(data.error);

        onChange(data.url, data.thumb);
        setPendingFile(null);
        return { url: data.url, thumb: data.thumb };
      } catch (e) {
        toast.error("Upload nota gagal: " + String(e));
        return null;
      } finally {
        setUploading(false);
      }
    }

    useImperativeHandle(ref, () => ({
      async upload() {
        if (!pendingFile) return null;
        return doUpload(pendingFile);
      },
      hasPendingFile() {
        return !!pendingFile;
      },
    }));

    function handleFile(file: File) {
      const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
      if (!allowed.includes(file.type)) {
        toast.error("Hanya JPG, PNG, WEBP, atau PDF yang diizinkan");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Ukuran file maksimal 5MB");
        return;
      }

      if (preview) URL.revokeObjectURL(preview);

      const localUrl = URL.createObjectURL(file);
      setPreview(localUrl);
      setPendingFile(file);
    }

    function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
      e.target.value = "";
    }

    function handleRemove() {
      if (preview) URL.revokeObjectURL(preview);
      setPreview(null);
      setPendingFile(null);
      onChange("", "");
    }

    const displayUrl = preview || value;
    const isImage = displayUrl && (
      displayUrl.match(/\.(jpg|jpeg|png|webp)$/i) ||
      displayUrl.includes("drive.google.com") ||
      preview
    );

    if (displayUrl) {
      return (
        <div className="relative">
          <p className="mb-1.5 text-sm font-medium text-gray-700">Foto Nota</p>
          <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
            {isImage ? (
              <div
                className="group relative h-40 w-full cursor-zoom-in"
                onClick={() => setIsFullscreen(true)}
              >
                <img
                  src={displayUrl}
                  alt="Preview nota"
                  className="h-full w-full object-cover transition duration-200 group-hover:brightness-90"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100 bg-black/10">
                  <Maximize2 className="h-6 w-6 text-white drop-shadow" />
                </div>
              </div>
            ) : (
              <div className="flex h-24 items-center justify-center gap-2 text-gray-500">
                <FileImage className="h-6 w-6" />
                <span className="text-sm">File terlampir</span>
              </div>
            )}

            {uploading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/50 z-10">
                <Loader2 className="h-6 w-6 animate-spin text-white" />
                <span className="text-xs text-white">Mengupload...</span>
              </div>
            )}

            {!uploading && (
              <button
                type="button"
                onClick={handleRemove}
                disabled={disabled}
                className="absolute right-2 top-2 rounded-full bg-red-500 p-1 text-white shadow hover:bg-red-600 z-10"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {value && !uploading && !pendingFile && (
            <a
              href={value}
              target="_blank"
              rel="noreferrer"
              className="mt-1 inline-block text-xs text-blue-600 hover:underline"
            >
              Lihat di Google Drive →
            </a>
          )}

          {/* MODAL FULLSCREEN OVERLAY (STRICT MODE: No Escape, No Outside Click) */}
          {isFullscreen && isImage && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 p-4 animate-in fade-in duration-200">
              {/* Satu-satunya tombol penutup */}
              <button
                type="button"
                onClick={() => setIsFullscreen(false)}
                className="absolute right-4 top-4 z-50 rounded-full bg-white/10 p-2.5 text-white backdrop-blur-sm transition hover:bg-white/20"
                title="Minimize"
              >
                <Minimize2 className="h-6 w-6" />
              </button>

              <img
                src={displayUrl}
                alt="Fullscreen nota"
                className="max-h-full max-w-full rounded-lg object-contain shadow-2xl animate-in zoom-in-95 duration-200"
              />
            </div>
          )}
        </div>
      );
    }

    return (
      <div>
        <p className="mb-1.5 text-sm font-medium text-gray-700">
          Foto Nota <span className="text-gray-400">(opsional)</span>
        </p>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,application/pdf"
          className="absolute h-0 w-0 overflow-hidden opacity-0"
          onChange={handleInputChange}
          disabled={disabled}
          tabIndex={-1}
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="absolute h-0 w-0 overflow-hidden opacity-0"
          onChange={handleInputChange}
          disabled={disabled}
          tabIndex={-1}
        />

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            disabled={disabled || uploading}
            onClick={() => cameraInputRef.current?.click()}
            className={cn(
              "flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-gray-300",
              "py-4 text-gray-500 transition-colors",
              "hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-700",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            <Camera className="h-6 w-6" />
            <span className="text-xs font-medium">Foto Kamera</span>
          </button>

          <button
            type="button"
            disabled={disabled || uploading}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-gray-300",
              "py-4 text-gray-500 transition-colors",
              "hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-700",
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
);

// ==========================================
// 2. HALAMAN UTAMA / COMPONENT UTAMA (FORM)
// ==========================================
interface FormState {
  totalBerat: number | "";
  totalPenjualan: number;
  notaUrl: string;
}

export default function TransaksiFormPage() {
  const fileUploadRef = useRef<FileUploadHandle>(null);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState<FormState>({
    totalBerat: "",
    totalPenjualan: 0,
    notaUrl: "",
  });

  // State kosmetik untuk menangani visual mask input rupiah "Rp 20.000"
  const [penjualanDisplay, setPenjualanDisplay] = useState("");

  // Hanya memformat ANGKA dengan separator ribuan (mis. "20.000").
  // Prefix "Rp" TIDAK disisipkan di sini — sudah ditampilkan lewat
  // <span> overlay di JSX, supaya tidak dobel ("Rp Rp 20.000").
  const formatRupiah = (value: string | number) => {
    const angka = String(value).replace(/\D/g, "");

    if (!angka) return "";

    return new Intl.NumberFormat("id-ID").format(Number(angka));
  };

  const handlePenjualanChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const angka = e.target.value.replace(/\D/g, "");

    if (!angka) {
      setPenjualanDisplay("");
      setFormData((prev) => ({
        ...prev,
        totalPenjualan: 0,
      }));
      return;
    }

    const numericValue = Number(angka);

    setFormData((prev) => ({
      ...prev,
      totalPenjualan: numericValue,
    }));

    setPenjualanDisplay(formatRupiah(numericValue));
  };

  const handleBeratChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData((prev) => ({
      ...prev,
      totalBerat: value === "" ? "" : Number(value),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.totalBerat || !formData.totalPenjualan) {
      toast.error("Mohon isi field yang bertanda bintang (*)");
      return;
    }

    setLoading(true);
    try {
      let finalNotaUrl = formData.notaUrl;

      // Jalankan upload file via Ref jika ada file pending yang belum di-upload ke Drive
      if (fileUploadRef.current?.hasPendingFile()) {
        const uploadResult = await fileUploadRef.current.upload();
        if (uploadResult) {
          finalNotaUrl = uploadResult.url;
        } else {
          throw new Error("Proses upload file nota gagal.");
        }
      }

      const payload = {
        ...formData,
        notaUrl: finalNotaUrl,
      };

      console.log("KIRIM DATA KEBACKEND:", payload);
      toast.success("Transaksi berhasil disimpan!");

      // Reset Form setelah sukses
      setFormData({ totalBerat: "", totalPenjualan: 0, notaUrl: "" });
      setPenjualanDisplay("");
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl p-6 bg-white rounded-2xl shadow-sm border border-gray-100 my-10">
      <h2 className="text-xl font-semibold text-gray-800 mb-6">Input Data Penjualan</h2>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* TOTAL BERAT (Spinner dihilangkan via utility CSS class) */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Total Berat (kg) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={formData.totalBerat}
              onChange={handleBeratChange}
              placeholder="0"
              disabled={loading}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          </div>

          {/* TOTAL PENJUALAN (Real-time Rupiah Formatting, tanpa spinner karena type="text") */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Total Penjualan (Rp) <span className="text-red-500">*</span>
            </label>

            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-500">
                Rp
              </span>

              <input
                type="text"
                inputMode="numeric"
                value={penjualanDisplay}
                onChange={handlePenjualanChange}
                placeholder="0"
                disabled={loading}
                className="w-full rounded-xl border border-gray-200 pl-11 pr-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* COMPONENT FILE UPLOAD */}
        <div>
          <FileUpload
            ref={fileUploadRef}
            value={formData.notaUrl}
            disabled={loading}
            onChange={(url) => setFormData((prev) => ({ ...prev, notaUrl: url }))}
          />
        </div>

        {/* TOMBOL SIMPAN */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? "Menyimpan..." : "Simpan Transaksi"}
          </button>
        </div>
      </form>
    </div>
  );
}