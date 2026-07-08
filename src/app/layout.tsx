import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "react-hot-toast";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Bank Sampah Warga",
  description: "Sistem pengelolaan bank sampah berbasis web untuk warga dan pengurus Karang Taruna",
  manifest: "/manifest.json",
  themeColor: "#16a34a",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className={inter.className}>
        {children}
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3000,
            style: { borderRadius: "12px", fontSize: "14px" },
            success: { iconTheme: { primary: "#16a34a", secondary: "#fff" } },
          }}
        />
      </body>
    </html>
  );
}
