import type { Metadata, Viewport } from "next";
import "./globals.css";
import PWARegister from "@/components/PWARegister";
import MobileNavigation from "@/components/MobileNavigation";
import FCMNotificationProvider from "@/components/FCMNotificationProvider";

export const metadata: Metadata = {
  title: "NyalaLagi — Layanan Perbaikan Kelistrikan",
  description:
    "NyalaLagi adalah platform digital PT Nyalalagi Solusi Andalan yang mempertemukan masyarakat dengan teknisi listrik.",
  applicationName: "NyalaLagi",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "NyalaLagi"
  },
  formatDetection: { telephone: false },
  icons: {
    icon: [
      { url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }]
  }
};

export const viewport: Viewport = {
  themeColor: "#ffd21a",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>
        <PWARegister />
        <FCMNotificationProvider />
        {children}
        <MobileNavigation />
      </body>
    </html>
  );
}
