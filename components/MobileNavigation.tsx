"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardList, Home, UserRound, Zap } from "lucide-react";

const items = [
  { href: "/", label: "Beranda", icon: Home },
  { href: "/lapor", label: "Laporkan", icon: Zap, primary: true },
  { href: "/laporan", label: "Laporan", icon: ClipboardList },
  { href: "/login", label: "Akun", icon: UserRound }
];

export default function MobileNavigation() {
  const pathname = usePathname();
  if (pathname.startsWith("/admin") || pathname.startsWith("/teknisi")) return null;

  return (
    <nav className="pwa-mobile-nav" aria-label="Navigasi utama mobile">
      {items.map((item) => {
        const Icon = item.icon;
        const active = item.href === "/"
          ? pathname === "/"
          : item.href === "/lapor"
            ? pathname === "/lapor"
            : pathname.startsWith(item.href);
        return (
          <Link key={item.href} href={item.href} className={`${active ? "is-active" : ""} ${item.primary ? "is-primary" : ""}`} aria-current={active ? "page" : undefined}>
            <span className="pwa-nav-icon"><Icon size={20} strokeWidth={active ? 2.6 : 2} /></span>
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
