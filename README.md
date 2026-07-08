# 🌿 Bank Sampah — Sistem Pengelolaan Bank Sampah Warga

Aplikasi web untuk mendigitalisasi pengelolaan bank sampah berbasis Google Sheets, dibangun dengan Next.js dan di-deploy gratis di Vercel.

---

## 🗂️ Struktur Project

```
bank-sampah/
├── gas/
│   └── Code.gs              ← Backend Google Apps Script (paste ke GAS)
├── src/
│   ├── app/
│   │   ├── page.tsx          ← Dashboard publik (/)
│   │   ├── warga/page.tsx    ← Cek saldo warga (/warga)
│   │   ├── batch/page.tsx    ← Riwayat batch (/batch)
│   │   ├── admin/
│   │   │   ├── page.tsx      ← Login admin (/admin)
│   │   │   ├── dashboard/    ← Dashboard admin
│   │   │   ├── warga/        ← CRUD warga
│   │   │   ├── setoran/      ← Input setoran
│   │   │   ├── penjualan/    ← Input penjualan
│   │   │   └── stok/         ← Monitor stok
│   │   └── api/              ← Next.js API Routes
│   ├── components/
│   │   ├── ui/               ← Button, Input, Card, Modal, dll
│   │   └── admin/            ← AdminLayout, PageHeader
│   ├── lib/
│   │   ├── gasClient.ts      ← HTTP client ke Google Apps Script
│   │   ├── auth.ts           ← Cookie-based auth
│   │   ├── utils.ts          ← Formatters & helpers
│   │   └── services/         ← Service layer per domain
│   └── types/index.ts        ← TypeScript types
└── public/
    └── manifest.json         ← PWA manifest
```

---

## 🚀 Cara Setup (Step by Step)

### LANGKAH 1 — Setup Google Spreadsheet

1. Buka [Google Sheets](https://sheets.google.com) → buat spreadsheet baru
2. Beri nama: **"Bank Sampah Data"**
3. Simpan — spreadsheet ini akan jadi database

### LANGKAH 2 — Setup Google Apps Script

1. Di spreadsheet, klik **Ekstensi → Apps Script**
2. Hapus kode default yang ada
3. Buka file `gas/Code.gs` di project ini, copy **seluruh isinya**
4. Paste ke editor Apps Script
5. Klik **Simpan** (Ctrl+S)
6. Di toolbar atas, pilih fungsi **`setupSheets`** dari dropdown
7. Klik **▶ Jalankan** — ini akan membuat semua sheet/tab otomatis
8. Izinkan akses Google jika diminta (klik "Advanced" → "Go to... (unsafe)")

### LANGKAH 3 — Deploy Apps Script sebagai Web App

1. Klik **Deploy → New Deployment**
2. Klik ikon ⚙️ di samping "Select type" → pilih **Web app**
3. Isi konfigurasi:
   - **Description**: Bank Sampah API
   - **Execute as**: Me (akun Google Anda)
   - **Who has access**: **Anyone** ← penting!
4. Klik **Deploy**
5. Copy URL yang muncul (formatnya: `https://script.google.com/macros/s/AKfycb.../exec`)

### LANGKAH 4 — Setup Project Lokal

```bash
# Clone atau download project ini
cd bank-sampah

# Install dependencies
npm install

# Buat file environment
cp .env.example .env.local
```

Edit `.env.local`:
```env
GOOGLE_SCRIPT_URL=https://script.google.com/macros/s/PASTE_URL_DARI_LANGKAH_3/exec
ADMIN_PASSWORD=password_pilihan_anda
AUTH_SECRET=random_string_minimal_32_karakter_ubah_ini
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

```bash
# Jalankan development server
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) — selesai! ✅

---

## ☁️ Deploy ke Vercel (Gratis)

### Cara 1 — Via Vercel Dashboard (Direkomendasikan)

1. Upload project ke GitHub (buat repo baru, push code)
2. Buka [vercel.com](https://vercel.com) → Login dengan GitHub
3. Klik **Add New → Project** → Import repo
4. Di bagian **Environment Variables**, tambahkan:

   | Name | Value |
   |------|-------|
   | `GOOGLE_SCRIPT_URL` | URL GAS dari Langkah 3 |
   | `ADMIN_PASSWORD` | Password admin Anda |
   | `AUTH_SECRET` | String random 32+ karakter |
   | `NEXT_PUBLIC_APP_URL` | `https://nama-project.vercel.app` |

5. Klik **Deploy** → tunggu ~2 menit → selesai!

### Cara 2 — Via CLI

```bash
npm install -g vercel
vercel login
vercel --prod
```

---

## 📱 Cara Penggunaan

### Untuk Admin (Pengurus Karang Taruna)

| Halaman | URL | Fungsi |
|---------|-----|--------|
| Login | `/admin` | Masuk dengan password |
| Dashboard | `/admin/dashboard` | Ringkasan statistik |
| Data Warga | `/admin/warga` | Tambah/edit warga |
| Input Setoran | `/admin/setoran` | Catat setoran per warga |
| Penjualan | `/admin/penjualan` | Input penjualan & generate pembagian |
| Monitor Stok | `/admin/stok` | Lihat status batch |

### Untuk Warga (Akses Publik, tanpa login)

| Halaman | URL | Fungsi |
|---------|-----|--------|
| Dashboard | `/` | Statistik keseluruhan |
| Cek Saldo | `/warga` | Cari saldo berdasarkan nama/RT |
| Riwayat | `/batch` | Semua batch & riwayat penjualan |

---

## 🔄 Alur Bisnis

```
1. Admin buat Collection Batch (C001)
       ↓
2. Admin input setoran warga ke batch
   [Budi: 2kg, Siti: 3kg, Ahmad: 1kg → Total: 6kg]
       ↓
3. Stok cukup → Admin input penjualan
   [Pilih C001, Total: 6kg, Harga: Rp 30.000]
       ↓
4. Sistem otomatis:
   ✓ Hitung harga/kg = Rp 5.000/kg
   ✓ Dana Warga 50% = Rp 15.000
   ✓ Kas KT 50% = Rp 15.000
   ✓ Distribusi proporsional:
     - Budi (2/6 = 33.3%): Rp 5.000
     - Siti (3/6 = 50.0%): Rp 7.500
     - Ahmad (1/6 = 16.7%): Rp 2.500
   ✓ Update saldo masing-masing warga
   ✓ Mark batch C001 → sold
```

---

## 🔧 Konfigurasi Tambahan

### Ganti Password Admin

Edit `ADMIN_PASSWORD` di environment variables Vercel, lalu redeploy.

### Update GAS setelah edit Code.gs

1. Buka Apps Script → Edit kode → Save
2. **Deploy → Manage Deployments**
3. Klik ✏️ Edit di deployment aktif → pilih versi "New version" → Update

> ⚠️ URL deployment TIDAK berubah saat update — tidak perlu ganti `.env`.

### Backup Data

Data tersimpan di Google Sheets. Download sebagai Excel kapan saja dari:
**File → Download → Microsoft Excel (.xlsx)**

---

## 🛠️ Tech Stack

| Layer | Tech |
|-------|------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Database | Google Sheets |
| Backend | Google Apps Script |
| Auth | Cookie + HMAC-SHA256 |
| Hosting | Vercel (Free) |
| File upload | Google Drive (manual URL) |

---

## ❓ FAQ

**Q: Apakah data aman?**
A: Data tersimpan di Google Sheets milik akun Google Anda. Hanya admin yang bisa menulis. Warga hanya read-only.

**Q: Berapa kapasitas Google Sheets?**
A: Google Sheets bisa menampung hingga 10 juta sel — lebih dari cukup untuk ratusan warga dan ribuan transaksi.

**Q: Bagaimana kalau Google Apps Script lambat?**
A: GAS memiliki cold start ~1-2 detik. Sudah dioptimasi dengan Next.js caching di sisi API routes.

**Q: Bisakah pakai database lain (Supabase, dll)?**
A: Bisa. Ganti implementasi di `src/lib/gasClient.ts` dan `src/lib/services/` dengan client database pilihan Anda.

**Q: Bagaimana cara upload nota?**
A: Upload foto nota ke Google Drive → klik kanan → "Get link" → paste URL saat input penjualan. Link akan muncul di riwayat penjualan publik.

---

## 📞 Kontak & Kontribusi

Project ini dibuat untuk membantu Karang Taruna mendigitalisasi bank sampah.
Silakan modifikasi sesuai kebutuhan. Kode ini open-source untuk keperluan sosial.

---

*Dibuat dengan ❤️ untuk kemajuan pengelolaan lingkungan berbasis komunitas*
