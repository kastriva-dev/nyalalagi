"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { collection, onSnapshot } from "firebase/firestore";
import { ArrowRight, CheckCircle2, Clock3, MapPin, ShieldCheck, Zap, Menu, Facebook, Instagram, Linkedin, Twitter, Star, MessageCircle, UserRound, UserPlus, BriefcaseBusiness, Award, LockKeyhole, Pencil, Settings2, LogOut } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { auth, db } from "@/lib/firebase";
import { getUserProfile } from "@/lib/user";
import { DEFAULT_SITE_CONTENT, SiteContent, mergeContent } from "@/lib/cms";
import CmsEditor from "@/components/CmsEditor";

const WHATSAPP_NUMBER = "6285195912262";
const whatsappHref = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Halo NyalaLagi, saya ingin membuat laporan kerusakan listrik.")}`;
const advantageIcons: LucideIcon[] = [Zap, Clock3, ShieldCheck, Star];
const aboutPointIcons: LucideIcon[] = [LockKeyhole, Award, CheckCircle2];

type EditTarget = { kind: "text" | "image"; path: string; label: string; imageSection?: string; imageIndex?: number };

function EditButton({ adminMode, target, onEdit }: { adminMode: boolean; target: EditTarget; onEdit: (target: EditTarget) => void }) {
  if (!adminMode) return null;
  return <button type="button" className="cms-edit-pencil" title={`Edit ${target.label}`} aria-label={`Edit ${target.label}`} onClick={(e) => { e.preventDefault(); e.stopPropagation(); onEdit(target); }}><Pencil size={14}/></button>;
}

const LogOutIcon = () => <LogOut size={16}/>;

function EditableImage({ adminMode, src, alt, className, target, onEdit }: { adminMode: boolean; src: string; alt: string; className?: string; target: EditTarget; onEdit: (target: EditTarget) => void }) {
  return <div className={`cms-image-edit-wrap ${adminMode ? "cms-editing" : ""}`}><img src={src} alt={alt} className={className}/><EditButton adminMode={adminMode} target={target} onEdit={onEdit}/></div>;
}

export default function LandingPage() {
  const [content, setContent] = useState<SiteContent>(DEFAULT_SITE_CONTENT);
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [adminMode, setAdminMode] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorTarget, setEditorTarget] = useState<EditTarget | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentRole, setCurrentRole] = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    if (!db) return;
    return onSnapshot(collection(db, "siteContent"), snap => {
      const doc = snap.docs.find(d => d.id === "main");
      if (doc) setContent(mergeContent(doc.data() as Partial<SiteContent>));
    });
  }, []);

  useEffect(() => {
    if (!auth) { setAuthReady(true); return; }
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user || user.isAnonymous) {
        setCurrentUser(null);
        setCurrentRole(null);
        setAuthReady(true);
        return;
      }
      setCurrentUser(user);
      try {
        const profile = await getUserProfile(user.uid);
        setCurrentRole(profile?.role || "customer");
        const params = new URLSearchParams(window.location.search);
        if (params.get("adminEdit") === "1" && profile?.role === "admin") setAdminMode(true);
      } catch {
        setCurrentRole("customer");
      } finally {
        setAuthReady(true);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const onScroll = () => { const max = document.documentElement.scrollHeight - window.innerHeight; const progress = max > 0 ? (window.scrollY / max) * 100 : 0; document.documentElement.style.setProperty("--scroll-progress", `${progress}%`); setScrolled(window.scrollY > 18); };
    onScroll(); window.addEventListener("scroll", onScroll, { passive: true }); return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const elements = Array.from(document.querySelectorAll<HTMLElement>("[data-scroll-reveal]"));
    if (!elements.length) return;
    const observer = new IntersectionObserver((entries) => entries.forEach((entry) => entry.target.classList.toggle("is-visible", entry.isIntersecting)), { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    elements.forEach((element) => observer.observe(element)); return () => observer.disconnect();
  }, [content]);

  useEffect(() => { const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") setMobileOpen(false); }; window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey); }, []);
  const edit = (target: EditTarget) => { setEditorTarget(target); setEditorOpen(true); };

  async function handleLogout() {
    try {
      if (auth) await signOut(auth);
      setCurrentUser(null);
      setCurrentRole(null);
      setAdminMode(false);
      setMobileOpen(false);
      if (window.location.pathname !== "/") window.location.href = "/";
    } catch (error) {
      console.error("Logout gagal:", error);
    }
  }

  const isLoggedIn = authReady && !!currentUser;
  const isAdmin = currentRole === "admin";

  return <main>
    <div className={`scroll-progress ${scrolled ? "is-active" : ""}`} aria-hidden="true" />
    {adminMode && <div className="cms-admin-bar"><div><Settings2 size={15}/> <b>CMS Mode</b><span>Klik ikon pensil pada gambar untuk mengganti langsung.</span></div><button onClick={() => { setEditorTarget(null); setEditorOpen(true); }}>Buka CMS Lengkap</button></div>}
    <header className={`nav ${scrolled ? "nav-scrolled" : ""} ${adminMode ? "nav-admin-mode" : ""}`}>
      <div className="container nav-inner">
        <Link href="/" className="brand"><Image src="/company/logo.png" alt="NyalaLagi" width={42} height={42} /> NyalaLagi</Link>
        <nav className="nav-links"><a href="#tentang">Tentang</a><a href="#keunggulan">Keunggulan</a><a href="#layanan">Layanan</a><a href="#portfolio">Portfolio</a><a href="#testimonial">Testimonial</a><a href="#mitra">Mitra Teknisi</a><a href="#kontak">Kontak</a></nav>
        <div className="nav-actions">
          {isLoggedIn ? (
            <>
              {isAdmin ? (
                <Link href="/admin" className="btn btn-secondary"><Settings2 size={16}/> Admin</Link>
              ) : (
                <Link href="/laporan" className="btn btn-secondary"><UserRound size={16}/> Laporan Saya</Link>
              )}
              <button type="button" className="btn btn-primary nav-logout-btn" onClick={handleLogout}><LogOutIcon/> Keluar</button>
            </>
          ) : (
            <>
              <Link href="/login" className="btn btn-secondary"><UserRound size={16}/> Masuk</Link>
              <Link href="/login?mode=register" className="btn btn-primary"><UserPlus size={16}/> Daftar</Link>
            </>
          )}
        </div>
        <button className={`mobile-menu ${mobileOpen ? "is-open" : ""}`} aria-label="Menu" aria-expanded={mobileOpen} onClick={() => setMobileOpen(v => !v)}><Menu size={24}/></button>
      </div>
    </header>
    <div className={`mobile-panel ${mobileOpen ? "is-open" : ""}`} aria-hidden={!mobileOpen}><a href="#tentang" onClick={() => setMobileOpen(false)}>Tentang</a><a href="#keunggulan" onClick={() => setMobileOpen(false)}>Keunggulan</a><a href="#layanan" onClick={() => setMobileOpen(false)}>Layanan</a><a href="#portfolio" onClick={() => setMobileOpen(false)}>Portfolio</a><a href="#testimonial" onClick={() => setMobileOpen(false)}>Testimonial</a><a href="#mitra" onClick={() => setMobileOpen(false)}>Mitra Teknisi</a><a href="#kontak" onClick={() => setMobileOpen(false)}>Kontak</a><div className="mobile-panel-actions">
          {isLoggedIn ? (
            <>
              {isAdmin ? <Link href="/admin" className="btn btn-secondary" onClick={() => setMobileOpen(false)}><Settings2 size={16}/> Admin</Link> : <Link href="/laporan" className="btn btn-secondary" onClick={() => setMobileOpen(false)}><UserRound size={16}/> Laporan Saya</Link>}
              <button type="button" className="btn btn-primary" onClick={handleLogout}><LogOut size={16}/> Keluar</button>
            </>
          ) : (
            <>
              <Link href="/login" className="btn btn-secondary" onClick={() => setMobileOpen(false)}><UserRound size={16}/> Masuk</Link>
              <Link href="/login?mode=register" className="btn btn-primary" onClick={() => setMobileOpen(false)}><UserPlus size={16}/> Daftar</Link>
            </>
          )}
        </div></div>

    <section className="hero dewi-hero">
      <div className="hero-orb hero-orb-one" aria-hidden="true"/><div className="hero-orb hero-orb-two" aria-hidden="true"/>
      <div className="hero-backdrop" style={{ backgroundImage: `url(${content.hero.image})` }} aria-hidden="true"/>
      <EditButton adminMode={adminMode} target={{kind:"image",path:"hero.image",label:"Hero image",imageSection:"hero"}} onEdit={edit}/>
      <div className="hero-dewi-content container"><div className="hero-copy hero-stagger" data-scroll-reveal>
        <div className="cms-editable-wrap"><span className="eyebrow"><Zap size={15}/> {content.hero.eyebrow}</span><EditButton adminMode={adminMode} target={{kind:"text",path:"hero.eyebrow",label:"Hero eyebrow"}} onEdit={edit}/></div>
        <div className="cms-editable-wrap"><h1>{content.hero.title} <span className="gradient-text">{content.hero.highlight}</span></h1><EditButton adminMode={adminMode} target={{kind:"text",path:"hero.title",label:"Hero judul"}} onEdit={edit}/></div>
        <div className="cms-editable-wrap"><p className="hero-description">{content.hero.description}</p><EditButton adminMode={adminMode} target={{kind:"text",path:"hero.description",label:"Hero deskripsi"}} onEdit={edit}/></div>
        <div className="hero-buttons"><Link href="/lapor" className="btn btn-primary"><Zap size={18}/> Laporan via Website <ArrowRight size={17}/></Link><a href={whatsappHref} target="_blank" rel="noreferrer" className="btn btn-whatsapp"><MessageCircle size={18}/> Laporan via WhatsApp</a></div>
        <div className="hero-trust-row"><span><CheckCircle2 size={17}/> Teknisi terdaftar</span><span><MapPin size={17}/> Berbasis lokasi</span><span><ShieldCheck size={17}/> Layanan aman</span></div>
      </div></div>
    </section>

    <section id="tentang" className="section"><div className="container"><div className="section-heading-grid scroll-reveal" data-scroll-reveal><div><span className="eyebrow">{content.about.eyebrow}</span><div className="cms-editable-wrap"><h2>{content.about.title}</h2><EditButton adminMode={adminMode} target={{kind:"text",path:"about.title",label:"Tentang judul"}} onEdit={edit}/></div></div><div><div className="cms-editable-wrap"><p className="muted">{content.about.text1}</p><EditButton adminMode={adminMode} target={{kind:"text",path:"about.text1",label:"Tentang teks 1"}} onEdit={edit}/></div><div className="cms-editable-wrap"><p className="muted">{content.about.text2}</p><EditButton adminMode={adminMode} target={{kind:"text",path:"about.text2",label:"Tentang teks 2"}} onEdit={edit}/></div></div></div>
      <div className="about-highlight card glass-card scroll-reveal" data-scroll-reveal><EditableImage adminMode={adminMode} src={content.about.image} alt="Tim NyalaLagi" className="about-highlight-image" target={{kind:"image",path:"about.image",label:"Tentang image",imageSection:"about"}} onEdit={edit}/><div className="about-promise-panel"><div className="about-highlight-copy"><span className="mini-label">{content.about.promiseLabel}</span><h3>{content.about.promiseTitle}</h3></div><div className="about-points">{content.about.points.map((point,i)=>{const Icon=aboutPointIcons[i%aboutPointIcons.length]; return <span key={`${point}-${i}`}><Icon size={18}/>{point}</span>})}</div></div></div>
    </div></section>

    <section id="keunggulan" className="section section-soft"><div className="container"><div className="center-heading scroll-reveal" data-scroll-reveal><span className="eyebrow">Keunggulan</span><h2>MUDAH, CEPAT, BERKUALITAS & ANDALAN</h2></div><div className="grid-4">{content.advantages.map((item,i)=>{const Icon=advantageIcons[i%advantageIcons.length]; return <article className={`card glass-card advantage-card scroll-reveal scroll-delay-${(i%3)+1}`} data-scroll-reveal key={item.title}><div className="advantage-icon"><Icon size={23}/></div><h3>{item.title}</h3><p className="muted">{item.text}</p></article>})}</div></div></section>

    <section id="layanan" className="section"><div className="container"><div className="center-heading scroll-reveal" data-scroll-reveal><span className="eyebrow">Layanan</span><h2>Layanan kelistrikan untuk kebutuhan rumah hingga proyek.</h2></div><div className="grid-4 service-grid">{content.services.map((s,index)=><article className={`card service-card glass-card scroll-reveal scroll-delay-${(index%3)+1}`} data-scroll-reveal key={`${s.title}-${index}`}><div className="service-image-wrap"><EditableImage adminMode={adminMode} src={s.image} alt={s.title} target={{kind:"image",path:`services.${index}.image`,label:`Layanan ${index+1} image`,imageSection:"services",imageIndex:index}} onEdit={edit}/><span className="service-number">0{index+1}</span></div><div className="service-body"><h3>{s.title}</h3><p className="muted">{s.text}</p><Link href="/lapor" className="text-link">Konsultasikan <ArrowRight size={16}/></Link></div></article>)}</div></div></section>

    <section id="portfolio" className="section section-soft"><div className="container"><div className="center-heading scroll-reveal" data-scroll-reveal><span className="eyebrow">Portfolio</span><h2>Portfolio semua layanan</h2><p className="muted">Contoh area pekerjaan yang dapat ditangani oleh tim dan mitra teknisi NyalaLagi.</p></div><div className="portfolio-grid">{content.portfolio.map((p,index)=><article className={`portfolio-item scroll-reveal scroll-delay-${(index%3)+1}`} data-scroll-reveal key={`${p.title}-${index}`}><EditableImage adminMode={adminMode} src={p.image} alt={p.title} target={{kind:"image",path:`portfolio.${index}.image`,label:`Portfolio ${index+1} image`,imageSection:"portfolio",imageIndex:index}} onEdit={edit}/><div className="portfolio-overlay"><span>NyalaLagi</span><h3>{p.title}</h3></div></article>)}</div></div></section>

    <section id="testimonial" className="section"><div className="container"><div className="center-heading scroll-reveal" data-scroll-reveal><span className="eyebrow">{content.testimonial.eyebrow}</span><h2>{content.testimonial.title}</h2><div className="rating-summary"><span className="rating-stars">★★★★★</span><b>{content.testimonial.rating}</b><span className="muted">{content.testimonial.ratingLabel}</span></div></div><div className="grid-3 testimonial-grid">{content.testimonial.items.map((t,index)=><article className={`card glass-card testimonial-card scroll-reveal scroll-delay-${index+1}`} data-scroll-reveal key={`${t.name}-${index}`}><div className="quote-mark">“</div><p>{t.text}</p><div className="testimonial-footer"><div><b>{t.name}</b><small>Pelanggan NyalaLagi</small></div><span className="stars">{'★'.repeat(Math.max(0,Math.min(5,t.rating)))}</span></div></article>)}</div></div></section>

    <section id="mitra" className="section partner-section"><div className="container"><div className="partner-shell glass-card scroll-reveal" data-scroll-reveal><div className="partner-copy"><span className="eyebrow"><BriefcaseBusiness size={15}/> {content.partner.eyebrow}</span><h2>{content.partner.title}</h2><p className="muted">{content.partner.text}</p><div className="hero-buttons"><Link href="/login?mode=register" className="btn btn-primary"><UserPlus size={18}/> Daftar Mitra</Link><a href={whatsappHref} target="_blank" rel="noreferrer" className="btn btn-secondary">Tanya via WhatsApp</a></div></div><div className="partner-benefits">{content.partner.benefits.map((b,index)=><div className="partner-benefit" key={b.title}><span>0{index+1}</span><div><b>{b.title}</b><p className="muted">{b.text}</p></div></div>)}</div></div></div></section>

    <section className="section dark-section"><div className="container"><div className="grid-3" style={{marginTop:0}}><div><span className="eyebrow">{content.vision.eyebrow}</span><h2>{content.vision.title}</h2></div><div className="card dark-glass"><h3>{content.vision.visionTitle}</h3><p className="muted">{content.vision.visionText}</p></div><div className="card dark-glass"><h3>{content.vision.missionTitle}</h3><p className="muted">{content.vision.missionText}</p></div></div></div></section>

    <section className="section"><div className="container"><div className="cta glass-cta"><div><span className="eyebrow">{content.cta.eyebrow}</span><h2 style={{marginBottom:10}}>{content.cta.title}</h2><p style={{margin:0}}>{content.cta.text}</p></div><div className="hero-buttons"><Link href="/lapor" className="btn btn-dark">Buat Laporan <ArrowRight size={18}/></Link><a href={whatsappHref} target="_blank" rel="noreferrer" className="btn btn-whatsapp">WhatsApp <MessageCircle size={18}/></a></div></div></div></section>

    <footer id="kontak" className="footer"><div className="container footer-grid"><div className="footer-company"><div className="footer-brand">NyalaLagi</div><p className="footer-address">{content.footer.address.split("\n").map((line,i)=><span key={i}>{line}{i < content.footer.address.split("\n").length-1 && <br/>}</span>)}</p><p className="footer-contact"><b>Phone:</b> {content.footer.phone}<br/><b>Email:</b> {content.footer.email}</p><div className="footer-socials" aria-label="Media sosial NyalaLagi"><a href="#" aria-label="X"><Twitter size={17}/></a><a href="#" aria-label="Facebook"><Facebook size={17}/></a><a href="#" aria-label="Instagram"><Instagram size={17}/></a><a href="#" aria-label="LinkedIn"><Linkedin size={17}/></a></div></div><div className="footer-column"><h3>Tautan Web</h3><a href="#">Beranda</a><a href="#tentang">Tentang</a><a href="#layanan">Layanan</a><a href="#portfolio">Portfolio</a><a href="#testimonial">Testimonial</a><a href="#mitra">Mitra Teknisi</a><a href="#kontak">Kontak</a></div><div className="footer-column"><h3>Produk Layanan</h3><a href="#layanan">Perbaikan Instalasi</a><a href="#layanan">Instalasi Listrik Baru</a><a href="#layanan">Penerangan Jalan Umum</a><a href="#layanan">Penangkal Petir</a><a href="#layanan">Dll</a></div><div className="footer-newsletter"><h3>{content.footer.newsletterTitle}</h3><p>{content.footer.newsletterText}</p><form className="newsletter-form" onSubmit={(e)=>e.preventDefault()}><input type="email" aria-label="Email newsletter" placeholder="Email Anda"/><button type="submit">Subscribe</button></form></div></div><div className="container footer-bottom"><small>© {new Date().getFullYear()} <strong>PT Nyalalagi Solusi Andalan</strong>. All rights reserved.</small></div></footer>
    <nav className="bottom-nav"><Link href="/"><span>⌂</span>Beranda</Link><Link href="/lapor" className="primary"><span>⚡</span>Laporkan</Link><Link href="/login"><span>◉</span>Masuk</Link></nav>
    {editorOpen && <CmsEditor content={content} initialTarget={editorTarget} onClose={() => { setEditorOpen(false); setEditorTarget(null); }}/>} 
  </main>;
}
