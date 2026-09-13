import type { Metadata, Viewport } from "next";
import "./globals.css";
import PWARegister from "@/components/PWARegister";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "NyalaLagi — Layanan Perbaikan Kelistrikan",
  description:
    "NyalaLagi adalah platform digital PT Nyalalagi Solusi Andalan yang mempertemukan masyarakat dengan teknisi listrik.",
  applicationName: "NyalaLagi",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/company/logo.png",
    apple: "/company/logo.png",
  },
  themeColor: "#ffffff",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Header />
        <PWARegister />
        {children}
        <Footer />
      </body>
    </html>
  );
}