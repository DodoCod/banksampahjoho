"use client";
import { useEffect } from "react";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 text-center">
      <h2 className="text-xl font-bold text-gray-900">Terjadi kesalahan</h2>
      <p className="mt-2 text-sm text-gray-500">{error.message}</p>
      <button
        onClick={reset}
        className="mt-6 rounded-xl bg-brand-600 px-6 py-3 text-sm font-medium text-white hover:bg-brand-700"
      >
        Coba Lagi
      </button>
    </div>
  );
}
