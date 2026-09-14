import type { Metadata, Viewport } from "next";
import "./globals.css";
import PWARegister from "@/components/PWARegister";
import FCMNotificationProvider from "@/components/FCMNotificationProvider";

export const metadata: Metadata = {
  title: "NyalaLagi — Layanan Perbaikan Kelistrikan",
  description:
    "NyalaLagi adalah platform digital PT Nyalalagi Solusi Andalan yang mempertemukan masyarakat dengan teknisi listrik.",
  applicationName: "NyalaLagi",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/company/logo.png",
    apple: "/company/logo.png"
  }
};

export const viewport: Viewport = {
  themeColor: "#ffd11a",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body><PWARegister /><FCMNotificationProvider />{children}</body>
    </html>
  );
}
