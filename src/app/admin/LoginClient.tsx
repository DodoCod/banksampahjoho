"use client";
import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Recycle, Lock } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import toast from "react-hot-toast";

export default function LoginClient() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Login berhasil!");
        router.push("/admin/dashboard");
        router.refresh();
      } else {
        toast.error(data.error ?? "Password salah");
      }
    } catch {
      toast.error("Terjadi kesalahan jaringan");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 shadow-lg shadow-brand-200">
            <Recycle className="h-8 w-8 text-white" />
          </div>
          <div className="text-center">
            <h1 className="text-xl font-bold text-gray-900">Bank Sampah Admin</h1>
            <p className="mt-1 text-sm text-gray-500">Masuk untuk mengelola data</p>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-brand-50 px-3 py-2.5">
            <Lock className="h-4 w-4 text-brand-600 flex-shrink-0" />
            <span className="text-xs text-brand-700 font-medium">Area Admin - Khusus Pengurus Karang Taruna</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Password Admin"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Masukkan password"
              required
              autoFocus
            />
            <Button type="submit" fullWidth loading={loading} size="lg">
              Masuk
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
