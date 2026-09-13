"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { ArrowRight, CheckCircle2, Clock3, MapPin, ShieldCheck, Zap, Menu, Facebook, Instagram, Linkedin, Twitter, Star, MessageCircle, UserRound, UserPlus, KeyRound, BriefcaseBusiness, Award, LockKeyhole } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const WHATSAPP_NUMBER = "6285195912262";
const whatsappHref = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Halo NyalaLagi, saya ingin membuat laporan kerusakan listrik.")}`;

const services = [
  {
    title: "Perbaikan Alat Instalasi Listrik",
    text: "Dengan dukungan teknisi listrik yang sangat berpengalaman, kami siap menyelesaikan semua kerusakan peralatan instalasi kelistrikan rumah Anda dengan hasil terbaik dan aman.",
    image: "/company/service-gangguan.jpg"
  },
  {
    title: "Instalasi Listrik Baru",
    text: "Kami menyediakan instalasi pemasangan listrik baru untuk perumahan, gedung, perkantoran, pabrik dan tempat usaha lainnya dengan standar keamanan dan keselamatan yang tinggi, instalasi rapi dan berkualitas.",
    image: "/company/service-instalasi.jpg"
  },
  {
    title: "Instalasi PJU & Maintenance",
    text: "Layanan instalasi dan maintenance Penerangan Jalan Umum (PJU) untuk menjaga pencahayaan tetap aman, efektif dan siap digunakan.",
    image: "/company/service-pju.jpg"
  },
  {
    title: "Instalasi Penangkal Petir Rumah & Gedung",
    text: "Pemasangan sistem penangkal petir dengan perhatian pada grounding, material berkualitas dan standar keselamatan untuk rumah maupun gedung.",
    image: "/company/service-petir.jpg"
  }
];

const advantages: Array<[title: string, text: string, Icon: LucideIcon]> = [
  ["MUDAH", "Layanan berbasis teknologi digital membuat pelanggan lebih mudah mendapatkan service kelistrikan dalam satu genggaman.", Zap],
  ["CEPAT", "Proses laporan dan pencarian teknisi berbasis lokasi membantu mempercepat penanganan problem kelistrikan.", Clock3],
  ["BERKUALITAS", "Didukung tenaga ahli kelistrikan yang mumpuni untuk memberikan hasil pekerjaan yang rapi, aman dan berkualitas.", ShieldCheck],
  ["ANDALAN", "Kemudahan, kecepatan dan kualitas menjadi komitmen NyalaLagi untuk menjadi penyedia teknisi listrik andalan masyarakat.", Star]
];

const portfolio = [
  ["Perbaikan Instalasi Rumah", "/company/service-gangguan.jpg"],
  ["Instalasi Listrik Baru", "/company/service-instalasi.jpg"],
  ["PJU & Maintenance", "/company/service-pju.jpg"],
  ["Penangkal Petir", "/company/service-petir.jpg"]
];

const testimonials = [
  ["Pelayanan cepat dan teknisinya komunikatif. Proses laporan juga terasa mudah.", "Pelanggan NyalaLagi", 5],
  ["Pekerjaan instalasinya rapi dan teknisi menjelaskan kondisi listrik dengan jelas.", "Pelanggan NyalaLagi", 5],
  ["Sangat membantu ketika ada gangguan listrik. Laporan bisa dibuat tanpa proses yang rumit.", "Pelanggan NyalaLagi", 5]
] as const;

const partnerBenefits = [
  ["Peluang pekerjaan", "Dapatkan peluang pekerjaan kelistrikan dari pelanggan NyalaLagi."],
  ["Jangkauan lebih luas", "Perluas area layanan dan temukan pelanggan sesuai lokasi Anda."],
  ["Profil profesional", "Bangun reputasi sebagai mitra teknisi yang profesional dan terpercaya."],
  ["Teknologi terintegrasi", "Gunakan sistem digital untuk menerima dan mengelola permintaan layanan."]
];

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const progress = max > 0 ? (window.scrollY / max) * 100 : 0;
      document.documentElement.style.setProperty("--scroll-progress", `${progress}%`);
      setScrolled(window.scrollY > 18);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const elements = Array.from(document.querySelectorAll<HTMLElement>("[data-scroll-reveal]"));
    if (!elements.length) return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => entry.target.classList.toggle("is-visible", entry.isIntersecting));
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <main>
      <div className={`scroll-progress ${scrolled ? "is-active" : ""}`} aria-hidden="true" />
      <header className={`nav ${scrolled ? "nav-scrolled" : ""}`}>
        <div className="container nav-inner">
          <Link href="/" className="brand"><Image src="/company/logo.png" alt="NyalaLagi" width={42} height={42} /> NyalaLagi</Link>
          <nav className="nav-links">
            <a href="#tentang">Tentang</a>
            <a href="#keunggulan">Keunggulan</a>
            <a href="#layanan">Layanan</a>
            <a href="#portfolio">Portfolio</a>
            <a href="#testimonial">Testimonial</a>
            <a href="#mitra">Mitra Teknisi</a>
            <a href="#kontak">Kontak</a>
          </nav>
          <div className="nav-actions">
            <Link href="/login" className="btn btn-secondary"><UserRound size={16}/> Masuk</Link>
            <Link href="/login?mode=register" className="btn btn-primary"><UserPlus size={16}/> Daftar</Link>
          </div>
          <button className={`mobile-menu ${mobileOpen ? "is-open" : ""}`} aria-label="Menu" aria-expanded={mobileOpen} onClick={() => setMobileOpen((value) => !value)}>
            <Menu size={24} />
          </button>
        </div>
      </header>
      <div className={`mobile-panel ${mobileOpen ? "is-open" : ""}`} aria-hidden={!mobileOpen}>
        <a href="#tentang" onClick={() => setMobileOpen(false)}>Tentang</a>
        <a href="#keunggulan" onClick={() => setMobileOpen(false)}>Keunggulan</a>
        <a href="#layanan" onClick={() => setMobileOpen(false)}>Layanan</a>
        <a href="#portfolio" onClick={() => setMobileOpen(false)}>Portfolio</a>
        <a href="#testimonial" onClick={() => setMobileOpen(false)}>Testimonial</a>
        <a href="#mitra" onClick={() => setMobileOpen(false)}>Mitra Teknisi</a>
        <a href="#kontak" onClick={() => setMobileOpen(false)}>Kontak</a>
        <div className="mobile-panel-actions">
          <Link href="/login" className="btn btn-secondary" onClick={() => setMobileOpen(false)}><UserRound size={16}/> Masuk</Link>
          <Link href="/login?mode=register" className="btn btn-primary" onClick={() => setMobileOpen(false)}><UserPlus size={16}/> Daftar</Link>
        </div>
      </div>

      <section className="hero dewi-hero">
        <div className="hero-orb hero-orb-one" aria-hidden="true" /><div className="hero-orb hero-orb-two" aria-hidden="true" />
        <div className="hero-backdrop" aria-hidden="true" />
        <div className="hero-dewi-content container">
          <div className="hero-copy hero-stagger" data-scroll-reveal>
            <span className="eyebrow"><Zap size={15}/> Mudah, Cepat, Berkualitas, Andalan</span>
            <h1>NyalaLagi <span className="gradient-text">Penyedia Teknisi Listrik Andalan Anda</span></h1>
            <p className="muted">NyalaLagi adalah platform digital di bawah naungan <b>PT Nyalalagi Solusi Andalan</b> yang menghubungkan masyarakat dengan tenaga ahli kelistrikan melalui layanan yang mudah, cepat, berkualitas dan menjadi andalan.</p>
            <div className="hero-buttons">
              <Link href="/lapor" className="btn btn-primary"><Zap size={18}/> Laporan via Website <ArrowRight size={17}/></Link>
              <a href={whatsappHref} target="_blank" rel="noreferrer" className="btn btn-whatsapp"><MessageCircle size={18}/> Laporan via WhatsApp</a>
            </div>
            <div className="hero-trust-row">
              <span><CheckCircle2 size={17}/> Teknisi terdaftar</span>
              <span><MapPin size={17}/> Berbasis lokasi</span>
              <span><ShieldCheck size={17}/> Layanan aman</span>
            </div>
          </div>
        </div>
      </section>

      <section id="tentang" className="section">
        <div className="container">
          <div className="section-heading-grid scroll-reveal" data-scroll-reveal>
            <div><span className="eyebrow">Tentang</span><h2>Nyalalagi apa sihhh ???</h2></div>
            <div>
              <p className="muted">Nyalalagi adalah platform digital yang menyediakan jasa perbaikan kelistrikan rumah Anda dengan cara yang <b>MUDAH</b>, penyelesaian <b>CEPAT</b>, hasil yang <b>BERKUALITAS</b> dan service yang menjadi <b>ANDALAN</b>.</p>
              <p className="muted">Dengan kombinasi antara teknologi digital yang canggih dan didukung tenaga ahli kelistrikan yang mumpuni, kami bertujuan menjadi penyedia jasa perbaikan listrik yang terkemuka di pasar dan menjadi andalan masyarakat.</p>
            </div>
          </div>
          <div className="about-highlight card glass-card scroll-reveal" data-scroll-reveal>
            <div><span className="mini-label">OUR PROMISE</span><h3>Solusi kelistrikan yang terasa sederhana bagi pelanggan.</h3></div>
            <div className="about-points"><span><LockKeyhole size={18}/> Proses digital</span><span><Award size={18}/> Tenaga ahli</span><span><CheckCircle2 size={18}/> Hasil berkualitas</span></div>
          </div>
        </div>
      </section>

      <section id="keunggulan" className="section section-soft">
        <div className="container">
          <div className="center-heading scroll-reveal" data-scroll-reveal><span className="eyebrow">Keunggulan</span><h2>Mudah. Cepat. Berkualitas. Andalan.</h2><p className="muted">Empat prinsip yang menjadi standar pengalaman NyalaLagi.</p></div>
          <div className="grid-4">
            {advantages.map(([title,text,Icon], index) => <div className={`card feature-card glass-card scroll-reveal scroll-delay-${(index % 3) + 1}`} data-scroll-reveal key={title}><div className="iconbox"><Icon size={21}/></div><h3>{title}</h3><p className="muted">{text}</p></div>)}
          </div>
        </div>
      </section>

      <section id="layanan" className="section">
        <div className="container">
          <span className="eyebrow">Layanan</span><h2 style={{marginTop:16}}>Layanan kelistrikan untuk kebutuhan rumah hingga proyek.</h2>
          <div className="grid-4 service-grid">
            {services.map((s,index) => <article className={`card service-card glass-card scroll-reveal scroll-delay-${(index % 3) + 1}`} data-scroll-reveal key={s.title}><div className="service-image-wrap"><img src={s.image} alt={s.title}/><span className="service-number">0{index + 1}</span></div><div className="service-body"><h3>{s.title}</h3><p className="muted">{s.text}</p><Link href="/lapor" className="text-link">Konsultasikan <ArrowRight size={16}/></Link></div></article>)}
          </div>
        </div>
      </section>

      <section id="portfolio" className="section section-soft">
        <div className="container"><div className="center-heading scroll-reveal" data-scroll-reveal><span className="eyebrow">Portfolio</span><h2>Portfolio semua layanan</h2><p className="muted">Contoh area pekerjaan yang dapat ditangani oleh tim dan mitra teknisi NyalaLagi.</p></div>
          <div className="portfolio-grid">{portfolio.map(([title,image],index) => <article className={`portfolio-item scroll-reveal scroll-delay-${(index % 3) + 1}`} data-scroll-reveal key={title}><img src={image} alt={title}/><div className="portfolio-overlay"><span>NyalaLagi</span><h3>{title}</h3></div></article>)}</div>
        </div>
      </section>

      <section id="testimonial" className="section">
        <div className="container"><div className="center-heading scroll-reveal" data-scroll-reveal><span className="eyebrow">Testimonial</span><h2>Dipercaya pelanggan, dinilai dari pengalaman.</h2><div className="rating-summary"><span className="rating-stars">★★★★★</span><b>5.0</b><span className="muted">Rating pelanggan</span></div></div>
          <div className="grid-3 testimonial-grid">{testimonials.map(([text,name,rating],index) => <article className={`card glass-card testimonial-card scroll-reveal scroll-delay-${index + 1}`} data-scroll-reveal key={name + index}><div className="quote-mark">“</div><p>{text}</p><div className="testimonial-footer"><div><b>{name}</b><small>Pelanggan NyalaLagi</small></div><span className="stars">{'★'.repeat(rating)}</span></div></article>)}</div>
        </div>
      </section>

      <section id="mitra" className="section partner-section">
        <div className="container"><div className="partner-shell glass-card scroll-reveal" data-scroll-reveal><div className="partner-copy"><span className="eyebrow"><BriefcaseBusiness size={15}/> Mitra Teknisi</span><h2>Benefit gabung mitra teknisi NyalaLagi</h2><p className="muted">Bergabung sebagai mitra teknisi dan jadilah bagian dari ekosistem layanan kelistrikan digital yang profesional.</p><div className="hero-buttons"><Link href="/login?mode=register" className="btn btn-primary"><UserPlus size={18}/> Daftar Mitra</Link><a href={whatsappHref} target="_blank" rel="noreferrer" className="btn btn-secondary">Tanya via WhatsApp</a></div></div><div className="partner-benefits">{partnerBenefits.map(([title,text],index) => <div className="partner-benefit" key={title}><span>0{index + 1}</span><div><b>{title}</b><p className="muted">{text}</p></div></div>)}</div></div></div>
      </section>

      <section className="section dark-section"><div className="container"><div className="grid-3" style={{marginTop:0}}><div><span className="eyebrow">Visi & Misi</span><h2>Menjadi penyedia jasa teknisi listrik paling terpercaya.</h2></div><div className="card dark-glass"><h3>Visi Kami</h3><p className="muted">Menjadi perusahaan penyedia jasa teknisi listrik paling terpercaya untuk memastikan keamanan, kenyamanan pelanggan dan menjadi andalan masyarakat umum maupun dunia usaha.</p></div><div className="card dark-glass"><h3>Misi Kami</h3><p className="muted">Memberikan layanan instalasi & perbaikan alat kelistrikan yang mudah, cepat, berkualitas & andalan; menghadirkan mitra teknisi yang berkompeten dan profesional melalui pelatihan berkelanjutan serta mendukung pemanfaatan inovasi teknologi digital.</p></div></div></div></section>

      <section className="section"><div className="container"><div className="cta glass-cta"><div><span className="eyebrow">Butuh bantuan?</span><h2 style={{marginBottom:10}}>Ada masalah listrik di rumah?</h2><p style={{margin:0}}>Buat laporan melalui website atau hubungi NyalaLagi langsung melalui WhatsApp.</p></div><div className="hero-buttons"><Link href="/lapor" className="btn btn-dark">Buat Laporan <ArrowRight size={18}/></Link><a href={whatsappHref} target="_blank" rel="noreferrer" className="btn btn-whatsapp">WhatsApp <MessageCircle size={18}/></a></div></div></div></section>

      <footer id="kontak" className="footer">
        <div className="container footer-grid">
          <div className="footer-company"><div className="footer-brand">NyalaLagi</div><p className="footer-address">Bandung Technopark Gedung C<br/>Jl Komunikasi No 1, Sukapura Kabupaten Bandung</p><p className="footer-contact"><b>Phone:</b> +62 851-9591-2262<br/><b>Email:</b> cs@nyalalagi.com</p><div className="footer-socials" aria-label="Media sosial NyalaLagi"><a href="#" aria-label="X"><Twitter size={17}/></a><a href="#" aria-label="Facebook"><Facebook size={17}/></a><a href="#" aria-label="Instagram"><Instagram size={17}/></a><a href="#" aria-label="LinkedIn"><Linkedin size={17}/></a></div></div>
          <div className="footer-column"><h3>Tautan Web</h3><a href="#">Beranda</a><a href="#tentang">Tentang</a><a href="#layanan">Layanan</a><a href="#portfolio">Portfolio</a><a href="#testimonial">Testimonial</a><a href="#mitra">Mitra Teknisi</a><a href="#kontak">Kontak</a></div>
          <div className="footer-column"><h3>Produk Layanan</h3><a href="#layanan">Perbaikan Instalasi</a><a href="#layanan">Instalasi Listrik Baru</a><a href="#layanan">Penerangan Jalan Umum</a><a href="#layanan">Penangkal Petir</a><a href="#layanan">Dll</a></div>
          <div className="footer-newsletter"><h3>Our Newsletter</h3><p>Subscribe to our newsletter and receive the latest news about our products and services!</p><form className="newsletter-form" onSubmit={(e) => e.preventDefault()}><input type="email" aria-label="Email newsletter" placeholder="Email Anda"/><button type="submit">Subscribe</button></form></div>
        </div>
        <div className="container footer-bottom"><small>© {new Date().getFullYear()} <strong>PT Nyalalagi Solusi Andalan</strong>. All rights reserved.</small></div>
      </footer>

      <nav className="bottom-nav"><Link href="/"><span>⌂</span>Beranda</Link><Link href="/lapor" className="primary"><span>⚡</span>Laporkan</Link><Link href="/login"><span>◉</span>Masuk</Link></nav>
    </main>
  );
}
