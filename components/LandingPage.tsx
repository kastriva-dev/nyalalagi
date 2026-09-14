"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { collection, onSnapshot } from "firebase/firestore";
import { ArrowRight, CheckCircle2, Clock, MapPin, ShieldCheck, Zap, Menu, Facebook, Instagram, Linkedin, Twitter, Star, MessageCircle, Users, Award, Headphones, Gauge, LogOut, X } from "lucide-react";
import type { FC, ReactNode } from "react";
import { auth, db, firebaseReady } from "@/lib/firebase";

interface NavLink {
  label: string;
  href: string;
  icon?: ReactNode;
}

export default function LandingPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentRole, setCurrentRole] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!firebaseReady) {
      setAuthReady(true);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth!, (user) => {
      setCurrentUser(user && !user.isAnonymous ? user : null);
      setAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      if (auth) await signOut(auth);
      setCurrentUser(null);
      setCurrentRole(null);
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const navLinks: NavLink[] = [
    { label: "Tentang", href: "#tentang" },
    { label: "Keunggulan", href: "#keunggulan" },
    { label: "Layanan", href: "#layanan" },
    { label: "Testimoni", href: "#testimoni" },
    { label: "Hubungi", href: "#hubungi" },
  ];

  return (
    <>
      {/* Navigation */}
      <nav className={scrolled ? "scrolled" : ""}>
        <div className="nav-inner">
          <Link href="/" className="nav-brand">
            <Zap size={24} />
            NyalaLagi
          </Link>

          {/* Desktop Menu */}
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2xl)" }}>
            <ul className="nav-menu" style={{ display: "none" }}>
              {navLinks.map((link) => (
                <li key={link.href}>
                  <a href={link.href} className="nav-link">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>

            {/* Auth Buttons */}
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-md)" }}>
              {currentUser ? (
                <>
                  <Link href="/lapor" className="btn btn-primary btn-sm">
                    <Zap size={16} />
                    Buat Laporan
                  </Link>
                  <button onClick={handleLogout} className="btn btn-secondary btn-sm">
                    <LogOut size={16} />
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" className="btn btn-secondary btn-sm">
                    <MessageCircle size={16} />
                    Login
                  </Link>
                  <Link href="/login" className="btn btn-primary btn-sm">
                    <Zap size={16} />
                    Mulai Sekarang
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="btn btn-ghost btn-icon"
            style={{ display: "none" }}
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main>
        {/* Hero Section */}
        <section className="hero">
          <div className="hero-content">
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "var(--space-xl)" }}>
              <span className="badge" style={{ display: "inline-flex", alignItems: "center", gap: "var(--space-sm)" }}>
                <Star size={16} />
                Solusi Kelistrikan Terpercaya #1 di Indonesia
              </span>
            </div>

            <h1 className="hero-title">
              Listrik Padam? Hubungi Teknisi Profesional Kami dalam 2 Jam
            </h1>

            <p className="hero-subtitle">
              NyalaLagi menghubungkan Anda dengan teknisi berstandar nasional untuk perbaikan listrik cepat, aman, dan terpercaya. Layanan 24/7 siap membantu Anda.
            </p>

            <div className="hero-cta">
              {!currentUser && (
                <>
                  <Link href="/login" className="btn btn-primary btn-lg">
                    <Zap size={20} />
                    Buat Laporan Sekarang
                    <ArrowRight size={20} />
                  </Link>
                  <Link href="#tentang" className="btn btn-outline btn-lg">
                    Pelajari Lebih Lanjut
                  </Link>
                </>
              )}
              {currentUser && (
                <>
                  <Link href="/lapor" className="btn btn-primary btn-lg">
                    <Zap size={20} />
                    Buat Laporan Baru
                  </Link>
                  <Link href="/laporan" className="btn btn-outline btn-lg">
                    Lihat Status Laporan
                  </Link>
                </>
              )}
            </div>

            {/* Trust Indicators */}
            <div
              style={{
                marginTop: "var(--space-3xl)",
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: "var(--space-2xl)",
                paddingTop: "var(--space-3xl)",
                borderTop: "1px solid var(--glass-border)",
              }}
            >
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "1.75rem", fontWeight: "800", color: "var(--accent-blue)" }}>5000+</div>
                <p style={{ fontSize: "0.875rem", color: "var(--gray-400)", margin: 0 }}>Pelanggan Puas</p>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "1.75rem", fontWeight: "800", color: "var(--accent-cyan)" }}>2-4 Jam</div>
                <p style={{ fontSize: "0.875rem", color: "var(--gray-400)", margin: 0 }}>Respons Cepat</p>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "1.75rem", fontWeight: "800", color: "var(--accent-emerald)" }}>100%</div>
                <p style={{ fontSize: "0.875rem", color: "var(--gray-400)", margin: 0 }}>Puas Dijamin</p>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="keunggulan" className="section">
          <div className="container">
            <div style={{ textAlign: "center", marginBottom: "var(--space-3xl)" }}>
              <h2 className="section-title">Keunggulan NyalaLagi</h2>
              <p style={{ maxWidth: "600px", margin: "0 auto", color: "var(--gray-300)" }}>
                Kami menyediakan solusi kelistrikan dengan standar internasional dan layanan pelanggan terbaik.
              </p>
            </div>

            <div className="features-grid">
              <div className="feature">
                <div className="feature-icon">
                  <Clock size={28} />
                </div>
                <h4 className="feature-title">Respons Cepat</h4>
                <p className="feature-description">Teknisi kami siap merespons dalam 2-4 jam kerja dengan peralatan lengkap dan profesional.</p>
              </div>

              <div className="feature">
                <div className="feature-icon">
                  <ShieldCheck size={28} />
                </div>
                <h4 className="feature-title">Berstandar Nasional</h4>
                <p className="feature-description">Semua teknisi tersertifikasi dan mengikuti standar keselamatan listrik nasional.</p>
              </div>

              <div className="feature">
                <div className="feature-icon">
                  <Award size={28} />
                </div>
                <h4 className="feature-title">Garansi 30 Hari</h4>
                <p className="feature-description">Setiap perbaikan dilengkapi garansi 30 hari jika terjadi masalah yang sama.</p>
              </div>

              <div className="feature">
                <div className="feature-icon">
                  <Users size={28} />
                </div>
                <h4 className="feature-title">Tim Berpengalaman</h4>
                <p className="feature-description">Tim teknisi kami memiliki pengalaman lebih dari 10 tahun di bidang kelistrikan.</p>
              </div>

              <div className="feature">
                <div className="feature-icon">
                  <Headphones size={28} />
                </div>
                <h4 className="feature-title">Dukungan 24/7</h4>
                <p className="feature-description">Hubungi kami kapan saja, tim support kami siap membantu Anda setiap waktu.</p>
              </div>

              <div className="feature">
                <div className="feature-icon">
                  <Gauge size={28} />
                </div>
                <h4 className="feature-title">Transparan & Jelas</h4>
                <p className="feature-description">Harga jelas tanpa biaya tersembunyi. Anda tahu apa yang Anda bayar.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Services Section */}
        <section id="layanan" className="section" style={{ background: "linear-gradient(135deg, rgba(59, 130, 246, 0.05), rgba(6, 182, 212, 0.05))" }}>
          <div className="container">
            <div style={{ textAlign: "center", marginBottom: "var(--space-3xl)" }}>
              <h2 className="section-title">Layanan Kami</h2>
              <p style={{ maxWidth: "600px", margin: "0 auto", color: "var(--gray-300)" }}>
                Kami menyediakan berbagai layanan perbaikan listrik untuk kebutuhan Anda.
              </p>
            </div>

            <div className="card-grid">
              {[
                {
                  title: "Perbaikan Listrik Umum",
                  description: "Memperbaiki masalah listrik di rumah, kantor, atau toko Anda dengan cepat dan profesional.",
                  icon: Zap,
                },
                {
                  title: "Instalasi Baru",
                  description: "Memasang sistem kelistrikan baru dengan standar internasional dan aman.",
                  icon: ShieldCheck,
                },
                {
                  title: "Maintenance Rutin",
                  description: "Pemeliharaan berkala untuk memastikan sistem kelistrikan Anda selalu dalam kondisi optimal.",
                  icon: Gauge,
                },
                {
                  title: "Konsultasi Gratis",
                  description: "Dapatkan konsultasi gratis dari teknisi profesional kami untuk kebutuhan listrik Anda.",
                  icon: MessageCircle,
                },
              ].map((service, idx) => (
                <div key={idx} className="card">
                  <div className="card-header">
                    <div className="card-icon">
                      <service.icon size={24} />
                    </div>
                    <h4 className="card-title">{service.title}</h4>
                  </div>
                  <p className="card-description">{service.description}</p>
                  <Link href="/login" className="btn btn-primary btn-sm" style={{ marginTop: "var(--space-lg)" }}>
                    Pesan Sekarang
                    <ArrowRight size={16} />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section id="testimoni" className="section">
          <div className="container">
            <div style={{ textAlign: "center", marginBottom: "var(--space-3xl)" }}>
              <h2 className="section-title">Testimoni Pelanggan</h2>
              <p style={{ maxWidth: "600px", margin: "0 auto", color: "var(--gray-300)" }}>
                Ribuan pelanggan puas telah mempercayai NyalaLagi untuk mengatasi masalah listrik mereka.
              </p>
            </div>

            <div className="card-grid">
              {[
                {
                  name: "Budi Santoso",
                  role: "Pemilik Rumah",
                  text: "Layanan NyalaLagi sangat cepat dan profesional. Teknisi yang datang sangat ramah dan perbaikannya bagus.",
                  rating: 5,
                },
                {
                  name: "Siti Nurhaliza",
                  role: "Pemilik Toko",
                  text: "Saya sangat terkesan dengan respons cepat NyalaLagi. Dalam 2 jam, masalah listrik saya sudah teratasi.",
                  rating: 5,
                },
                {
                  name: "Ahmad Wijaya",
                  role: "Pengelola Kantor",
                  text: "Tim NyalaLagi membantu kami dengan instalasi listrik baru. Pekerjaan mereka rapi dan sesuai standar.",
                  rating: 5,
                },
              ].map((testimonial, idx) => (
                <div key={idx} className="glass-card">
                  <div style={{ display: "flex", gap: "var(--space-sm)", marginBottom: "var(--space-lg)" }}>
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} size={18} style={{ fill: "var(--accent-amber)", color: "var(--accent-amber)" }} />
                    ))}
                  </div>
                  <p style={{ marginBottom: "var(--space-lg)", fontStyle: "italic" }}>{testimonial.text}</p>
                  <div>
                    <p style={{ fontWeight: "600", margin: 0 }}>{testimonial.name}</p>
                    <p style={{ fontSize: "0.875rem", color: "var(--gray-400)", margin: 0 }}>{testimonial.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="section" style={{ background: "linear-gradient(135deg, #3b82f6, #06b6d4)" }}>
          <div className="container" style={{ textAlign: "center", maxWidth: "600px" }}>
            <h2 style={{ color: "white", marginBottom: "var(--space-lg)" }}>Siap Memulai?</h2>
            <p style={{ color: "rgba(255,255,255,0.9)", marginBottom: "var(--space-2xl)" }}>
              Hubungi kami sekarang dan dapatkan perbaikan listrik profesional dalam hitungan jam.
            </p>
            <div style={{ display: "flex", gap: "var(--space-lg)", justifyContent: "center", flexWrap: "wrap" }}>
              <Link href="/login" className="btn btn-primary" style={{ background: "white", color: "var(--primary-900)" }}>
                <Zap size={20} />
                Buat Laporan Sekarang
              </Link>
              <a href="tel:+62800NYALALAGI" className="btn" style={{ background: "rgba(255,255,255,0.2)", color: "white", border: "1px solid white" }}>
                <Headphones size={20} />
                Hubungi Kami
              </a>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer
          style={{
            borderTop: "1px solid var(--glass-border)",
            padding: "var(--space-3xl) 0",
            background: "rgba(10, 14, 39, 0.5)",
          }}
        >
          <div className="container">
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                gap: "var(--space-2xl)",
                marginBottom: "var(--space-3xl)",
              }}
            >
              <div>
                <h5 style={{ marginBottom: "var(--space-lg)", display: "flex", alignItems: "center", gap: "var(--space-md)" }}>
                  <Zap size={20} />
                  NyalaLagi
                </h5>
                <p style={{ color: "var(--gray-400)", fontSize: "0.875rem" }}>
                  Solusi kelistrikan terpercaya untuk rumah, kantor, dan bisnis Anda.
                </p>
              </div>

              <div>
                <h5 style={{ marginBottom: "var(--space-lg)" }}>Layanan</h5>
                <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: "var(--space-sm)" }}>
                  <li>
                    <a href="#layanan" style={{ color: "var(--gray-400)", fontSize: "0.875rem", transition: "color var(--transition-fast)" }} onMouseEnter={(e) => (e.currentTarget.style.color = "var(--accent-blue)")} onMouseLeave={(e) => (e.currentTarget.style.color = "var(--gray-400)")}>
                      Perbaikan Listrik
                    </a>
                  </li>
                  <li>
                    <a href="#layanan" style={{ color: "var(--gray-400)", fontSize: "0.875rem", transition: "color var(--transition-fast)" }} onMouseEnter={(e) => (e.currentTarget.style.color = "var(--accent-blue)")} onMouseLeave={(e) => (e.currentTarget.style.color = "var(--gray-400)")}>
                      Instalasi Baru
                    </a>
                  </li>
                  <li>
                    <a href="#layanan" style={{ color: "var(--gray-400)", fontSize: "0.875rem", transition: "color var(--transition-fast)" }} onMouseEnter={(e) => (e.currentTarget.style.color = "var(--accent-blue)")} onMouseLeave={(e) => (e.currentTarget.style.color = "var(--gray-400)")}>
                      Maintenance
                    </a>
                  </li>
                </ul>
              </div>

              <div>
                <h5 style={{ marginBottom: "var(--space-lg)" }}>Perusahaan</h5>
                <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: "var(--space-sm)" }}>
                  <li>
                    <a href="#tentang" style={{ color: "var(--gray-400)", fontSize: "0.875rem", transition: "color var(--transition-fast)" }} onMouseEnter={(e) => (e.currentTarget.style.color = "var(--accent-blue)")} onMouseLeave={(e) => (e.currentTarget.style.color = "var(--gray-400)")}>
                      Tentang Kami
                    </a>
                  </li>
                  <li>
                    <a href="#hubungi" style={{ color: "var(--gray-400)", fontSize: "0.875rem", transition: "color var(--transition-fast)" }} onMouseEnter={(e) => (e.currentTarget.style.color = "var(--accent-blue)")} onMouseLeave={(e) => (e.currentTarget.style.color = "var(--gray-400)")}>
                      Hubungi Kami
                    </a>
                  </li>
                  <li>
                    <a href="#" style={{ color: "var(--gray-400)", fontSize: "0.875rem", transition: "color var(--transition-fast)" }} onMouseEnter={(e) => (e.currentTarget.style.color = "var(--accent-blue)")} onMouseLeave={(e) => (e.currentTarget.style.color = "var(--gray-400)")}>
                      Kebijakan Privasi
                    </a>
                  </li>
                </ul>
              </div>

              <div>
                <h5 style={{ marginBottom: "var(--space-lg)" }}>Ikuti Kami</h5>
                <div style={{ display: "flex", gap: "var(--space-md)", flexWrap: "wrap" }}>
                  <a href="#" className="btn btn-secondary btn-icon">
                    <Facebook size={18} />
                  </a>
                  <a href="#" className="btn btn-secondary btn-icon">
                    <Instagram size={18} />
                  </a>
                  <a href="#" className="btn btn-secondary btn-icon">
                    <Linkedin size={18} />
                  </a>
                  <a href="#" className="btn btn-secondary btn-icon">
                    <Twitter size={18} />
                  </a>
                </div>
              </div>
            </div>

            <div style={{ borderTop: "1px solid var(--glass-border)", paddingTop: "var(--space-2xl)", textAlign: "center", color: "var(--gray-400)", fontSize: "0.875rem" }}>
              <p style={{ margin: 0 }}>© 2024 NyalaLagi. Semua hak dilindungi. PT Nyalalagi Solusi Andalan</p>
            </div>
          </div>
        </footer>
      </main>
    </>
  );
}
