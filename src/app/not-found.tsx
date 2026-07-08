import Link from "next/link";
import { Recycle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-100">
        <Recycle className="h-9 w-9 text-brand-600" />
      </div>
      <h1 className="text-4xl font-bold text-gray-900">404</h1>
      <p className="mt-2 text-gray-500">Halaman tidak ditemukan</p>
      <Link
        href="/"
        className="mt-6 rounded-xl bg-brand-600 px-6 py-3 text-sm font-medium text-white hover:bg-brand-700"
      >
        Kembali ke Beranda
      </Link>
    </div>
  );
}
