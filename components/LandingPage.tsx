"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import {
  ArrowRight, Award, BadgeCheck, BriefcaseBusiness, CheckCircle, CheckCircle2, ChevronDown,
  ClipboardList, Clock3, Facebook, Headphones, Instagram, Linkedin, LockKeyhole, LogOut, MapPin,
  Menu, MessageCircle, Navigation, Pencil, SearchCheck, Settings2, ShieldCheck, Star, Timer, Twitter,
  UserPlus, UserRound, Wrench, Zap
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { auth, db } from "@/lib/firebase";
import { getUserProfile } from "@/lib/user";
import { DEFAULT_SITE_CONTENT, SiteContent, mergeContent } from "@/lib/cms";
import CmsEditor from "@/components/CmsEditor";
import SiteSeo from "@/components/SiteSeo";

const advantageIcons: LucideIcon[] = [Zap, Clock3, ShieldCheck, Star];
const aboutPointIcons: LucideIcon[] = [LockKeyhole, Award, CheckCircle2];
const processIcons: LucideIcon[] = [ClipboardList, SearchCheck, Wrench, CheckCircle];
const technicianIcons: LucideIcon[] = [BadgeCheck, Navigation, Timer, Star];

type EditTarget = { kind: "text" | "image"; path: string; label: string; imageSection?: string; imageIndex?: number };

function EditButton({ adminMode, target, onEdit }: { adminMode: boolean; target: EditTarget; onEdit: (target: EditTarget) => void }) {
  if (!adminMode) return null;
  return <button type="button" className="cms-edit-pencil" title={`Edit ${target.label}`} aria-label={`Edit ${target.label}`} onClick={(event) => { event.preventDefault(); event.stopPropagation(); onEdit(target); }}><Pencil size={14}/></button>;
}

function EditableImage({ adminMode, src, alt, className, target, onEdit }: { adminMode: boolean; src: string; alt: string; className?: string; target: EditTarget; onEdit: (target: EditTarget) => void }) {
  return <div className={`cms-image-edit-wrap ${adminMode ? "cms-editing" : ""}`}><img src={src} alt={alt} className={className}/><EditButton adminMode={adminMode} target={target} onEdit={onEdit}/></div>;
}

function normalizeWhatsapp(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0")) return `62${digits.slice(1)}`;
  return digits || "6285195912262";
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

  const whatsappHref = useMemo(() => `https://wa.me/${normalizeWhatsapp(content.footer.phone)}?text=${encodeURIComponent("Halo NyalaLagi, saya ingin membuat laporan kerusakan listrik.")}`, [content.footer.phone]);

  useEffect(() => {
    if (!db) return;
    const firestore = db;
    return onSnapshot(doc(firestore, "siteContent", "main"), snapshot => {
      if (snapshot.exists()) setContent(mergeContent(snapshot.data()));
      else setContent(DEFAULT_SITE_CONTENT);
    });
  }, []);

  useEffect(() => {
    if (!auth) { setAuthReady(true); return; }
    const firebaseAuth = auth;
    return onAuthStateChanged(firebaseAuth, async user => {
      if (!user || user.isAnonymous) {
        setCurrentUser(null); setCurrentRole(null); setAdminMode(false); setAuthReady(true); return;
      }
      setCurrentUser(user);
      try {
        const profile = await getUserProfile(user.uid);
        const role = profile?.role || "customer";
        setCurrentRole(role);
        const params = new URLSearchParams(window.location.search);
        setAdminMode(params.get("adminEdit") === "1" && role === "admin");
      } catch {
        setCurrentRole("customer");
      } finally {
        setAuthReady(true);
      }
    });
  }, []);

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
    const observer = new IntersectionObserver(entries => entries.forEach(entry => entry.target.classList.toggle("is-visible", entry.isIntersecting)), { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    elements.forEach(element => observer.observe(element));
    return () => observer.disconnect();
  }, [content]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") setMobileOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const edit = (target: EditTarget) => { setEditorTarget(target); setEditorOpen(true); };
  const isLoggedIn = authReady && !!currentUser;
  const isAdmin = currentRole === "admin";

  async function handleLogout() {
    try {
      if (auth) await signOut(auth);
      setCurrentUser(null); setCurrentRole(null); setAdminMode(false); setMobileOpen(false);
      if (window.location.pathname !== "/") window.location.href = "/";
    } catch (error) { console.error("Logout gagal:", error); }
  }

  return <main>
    <SiteSeo seo={content.seo}/>
    <div className={`scroll-progress ${scrolled ? "is-active" : ""}`} aria-hidden="true"/>
    {adminMode && <div className="cms-admin-bar"><div><Settings2 size={15}/><b>CMS Mode</b><span>Hero, Tentang, Keunggulan, Layanan, Portfolio, Cara Kerja, Testimonial, Teknisi, FAQ, CTA, Footer & SEO.</span></div><button onClick={() => { setEditorTarget(null); setEditorOpen(true); }}>Buka CMS Lengkap</button></div>}

    <header className={`nav ${scrolled ? "nav-scrolled" : ""} ${adminMode ? "nav-admin-mode" : ""}`}>
      <div className="container nav-inner">
        <Link href="/" className="brand"><Image src="/company/logo.png" alt="NyalaLagi" width={42} height={42}/> NyalaLagi</Link>
        <nav className="nav-links"><a href="#tentang">Tentang</a><a href="#cara-kerja">Cara Kerja</a><a href="#layanan">Layanan</a><a href="#teknisi">Teknisi</a><a href="#testimonial">Testimonial</a><a href="#faq">FAQ</a><a href="#kontak">Kontak</a></nav>
        <div className="nav-actions">
          {isLoggedIn ? <>{isAdmin ? <Link href="/admin" className="btn btn-secondary"><Settings2 size={16}/> Admin</Link> : <Link href="/laporan" className="btn btn-secondary"><UserRound size={16}/> Laporan Saya</Link>}<button type="button" className="btn btn-primary nav-logout-btn" onClick={handleLogout}><LogOut size={16}/> Keluar</button></> : <><Link href="/login" className="btn btn-secondary"><UserRound size={16}/> Masuk</Link><Link href="/login?mode=register" className="btn btn-primary"><UserPlus size={16}/> Daftar</Link></>}
        </div>
        <button className={`mobile-menu ${mobileOpen ? "is-open" : ""}`} aria-label="Menu" aria-expanded={mobileOpen} onClick={() => setMobileOpen(value => !value)}><Menu size={24}/></button>
      </div>
    </header>

    <div className={`mobile-panel ${mobileOpen ? "is-open" : ""}`} aria-hidden={!mobileOpen}>
      <a href="#tentang" onClick={() => setMobileOpen(false)}>Tentang</a><a href="#keunggulan" onClick={() => setMobileOpen(false)}>Keunggulan</a><a href="#cara-kerja" onClick={() => setMobileOpen(false)}>Cara Kerja</a><a href="#layanan" onClick={() => setMobileOpen(false)}>Layanan</a><a href="#portfolio" onClick={() => setMobileOpen(false)}>Portfolio</a><a href="#teknisi" onClick={() => setMobileOpen(false)}>Teknisi</a><a href="#testimonial" onClick={() => setMobileOpen(false)}>Testimonial</a><a href="#faq" onClick={() => setMobileOpen(false)}>FAQ</a><a href="#kontak" onClick={() => setMobileOpen(false)}>Kontak</a>
      <div className="mobile-panel-actions">{isLoggedIn ? <>{isAdmin ? <Link href="/admin" className="btn btn-secondary" onClick={() => setMobileOpen(false)}><Settings2 size={16}/> Admin</Link> : <Link href="/laporan" className="btn btn-secondary" onClick={() => setMobileOpen(false)}><UserRound size={16}/> Laporan Saya</Link>}<button type="button" className="btn btn-primary" onClick={handleLogout}><LogOut size={16}/> Keluar</button></> : <><Link href="/login" className="btn btn-secondary" onClick={() => setMobileOpen(false)}><UserRound size={16}/> Masuk</Link><Link href="/login?mode=register" className="btn btn-primary" onClick={() => setMobileOpen(false)}><UserPlus size={16}/> Daftar</Link></>}</div>
    </div>

    <section className="hero dewi-hero">
      <div className="hero-orb hero-orb-one" aria-hidden="true"/><div className="hero-orb hero-orb-two" aria-hidden="true"/>
      <div className="hero-backdrop" style={{ backgroundImage: `url(${content.hero.image})` }} aria-hidden="true"/>
      <EditButton adminMode={adminMode} target={{kind:"image",path:"hero.image",label:"Hero image",imageSection:"hero"}} onEdit={edit}/>
      <div className="hero-dewi-content container"><div className="hero-copy hero-stagger" data-scroll-reveal>
        <span className="eyebrow"><Zap size={15}/> {content.hero.eyebrow}</span>
        <h1><span className="hero-problem">{content.hero.title}</span><br/><span className="gradient-text">{content.hero.highlight}</span></h1>
        <p className="hero-description">{content.hero.description}</p>
        <div className="hero-buttons"><Link href="/lapor" className="btn btn-primary"><Zap size={18}/> {content.hero.primaryButtonLabel} <ArrowRight size={17}/></Link><a href={whatsappHref} target="_blank" rel="noreferrer" className="btn btn-whatsapp"><MessageCircle size={18}/> {content.hero.secondaryButtonLabel}</a></div>
        <div className="hero-trust-row">{content.hero.trustItems.map((item, index) => { const Icon = [CheckCircle2, MapPin, ShieldCheck][index % 3]; return <span key={`${item}-${index}`}><Icon size={17}/>{item}</span>; })}</div>
      </div></div>
    </section>

    <section id="tentang" className="section"><div className="container">
      <div className="section-heading-grid scroll-reveal" data-scroll-reveal><div><span className="eyebrow">{content.about.eyebrow}</span><h2>{content.about.title}</h2></div><div><p className="muted">{content.about.text1}</p><p className="muted">{content.about.text2}</p></div></div>
      <div className="about-highlight card glass-card scroll-reveal" data-scroll-reveal><EditableImage adminMode={adminMode} src={content.about.image} alt="Tim NyalaLagi" className="about-highlight-image" target={{kind:"image",path:"about.image",label:"Tentang image",imageSection:"about"}} onEdit={edit}/><div className="about-promise-panel"><div className="about-highlight-copy"><span className="mini-label">{content.about.promiseLabel}</span><h3>{content.about.promiseTitle}</h3></div><div className="about-points">{content.about.points.map((point, i) => { const Icon = aboutPointIcons[i % aboutPointIcons.length]; return <span key={`${point}-${i}`}><Icon size={18}/>{point}</span>; })}</div></div></div>
    </div></section>

    <section id="keunggulan" className="section section-soft"><div className="container"><div className="center-heading scroll-reveal" data-scroll-reveal><span className="eyebrow">{content.advantages.eyebrow}</span><h2>{content.advantages.title}</h2>{content.advantages.description && <p className="muted">{content.advantages.description}</p>}</div><div className="grid-4">{content.advantages.items.map((item, i) => { const Icon = advantageIcons[i % advantageIcons.length]; return <article className={`card glass-card advantage-card scroll-reveal scroll-delay-${(i%3)+1}`} data-scroll-reveal key={`${item.title}-${i}`}><div className="advantage-icon"><Icon size={23}/></div><h3>{item.title}</h3><p className="muted">{item.text}</p></article>; })}</div></div></section>

    <section id="cara-kerja" className="section process-section"><div className="container"><div className="center-heading scroll-reveal" data-scroll-reveal><span className="eyebrow"><ClipboardList size={15}/> {content.process.eyebrow}</span><h2>{content.process.title}</h2><p className="muted">{content.process.description}</p></div><div className="process-grid">{content.process.items.map((step,index) => { const Icon = processIcons[index % processIcons.length]; return <article className={`process-step scroll-reveal scroll-delay-${(index%3)+1}`} data-scroll-reveal key={`${step.title}-${index}`}><div className="process-step-top"><span>{String(index+1).padStart(2,"0")}</span><div className="process-icon"><Icon size={21}/></div></div><h3>{step.title}</h3><p className="muted">{step.text}</p>{index < content.process.items.length - 1 && <div className="process-connector" aria-hidden="true"/>}</article>; })}</div></div></section>

    <section id="layanan" className="section"><div className="container"><div className="center-heading scroll-reveal" data-scroll-reveal><span className="eyebrow">{content.services.eyebrow}</span><h2>{content.services.title}</h2>{content.services.description && <p className="muted">{content.services.description}</p>}</div><div className="grid-4 service-grid">{content.services.items.map((service,index) => <article className={`card service-card glass-card scroll-reveal scroll-delay-${(index%3)+1}`} data-scroll-reveal key={`${service.title}-${index}`}><div className="service-image-wrap"><EditableImage adminMode={adminMode} src={service.image} alt={service.title} target={{kind:"image",path:`services.items.${index}.image`,label:`Layanan ${index+1} image`,imageSection:"services",imageIndex:index}} onEdit={edit}/><span className="service-number">{String(index+1).padStart(2,"0")}</span></div><div className="service-body"><h3>{service.title}</h3><p className="muted">{service.text}</p><Link href="/lapor" className="text-link">{content.services.buttonLabel} <ArrowRight size={16}/></Link></div></article>)}</div></div></section>

    <section id="portfolio" className="section section-soft"><div className="container"><div className="center-heading scroll-reveal" data-scroll-reveal><span className="eyebrow">{content.portfolio.eyebrow}</span><h2>{content.portfolio.title}</h2><p className="muted">{content.portfolio.description}</p></div><div className="portfolio-grid">{content.portfolio.items.map((portfolio,index) => <article className={`portfolio-item scroll-reveal scroll-delay-${(index%3)+1}`} data-scroll-reveal key={`${portfolio.title}-${index}`}><div className="portfolio-media"><EditableImage adminMode={adminMode} src={portfolio.image} alt={portfolio.title || `Portfolio NyalaLagi ${index+1}`} target={{kind:"image",path:`portfolio.items.${index}.image`,label:`Portfolio ${index+1} image`,imageSection:"portfolio",imageIndex:index}} onEdit={edit}/></div><div className="portfolio-caption"><span>{portfolio.category || "NyalaLagi"}</span><h3>{portfolio.title || `Portfolio ${index+1}`}</h3></div></article>)}</div></div></section>

    <section id="teknisi" className="section technician-trust-section"><div className="container"><div className="technician-trust-shell glass-card scroll-reveal" data-scroll-reveal><div className="technician-trust-copy"><span className="eyebrow"><BadgeCheck size={15}/> {content.technicians.eyebrow}</span><h2>{content.technicians.title}</h2><p className="muted">{content.technicians.description}</p><div className="trust-points">{content.technicians.points.map((point,index) => { const Icon = technicianIcons[index % technicianIcons.length]; return <span key={`${point}-${index}`}><Icon size={17}/>{point}</span>; })}</div><Link href="/lapor" className="btn btn-primary">{content.technicians.buttonLabel} <ArrowRight size={17}/></Link></div><div className="technician-trust-card"><div className="trust-card-glow" aria-hidden="true"/><div className="trust-avatar"><Wrench size={27}/></div><div><span className="trust-status"><i/> {content.technicians.statusLabel}</span><h3>{content.technicians.cardTitle}</h3><p>{content.technicians.cardText}</p></div><div className="trust-mini-stats">{content.technicians.cardSteps.map((step,index) => <div key={`${step}-${index}`}><b>{String(index+1).padStart(2,"0")}</b><span>{step}</span></div>)}</div></div></div></div></section>

    <section id="testimonial" className="section"><div className="container"><div className="center-heading scroll-reveal" data-scroll-reveal><span className="eyebrow">{content.testimonial.eyebrow}</span><h2>{content.testimonial.title}</h2>{content.testimonial.description && <p className="muted">{content.testimonial.description}</p>}<div className="rating-summary"><span className="rating-stars">★★★★★</span><b>{content.testimonial.rating}</b><span className="muted">{content.testimonial.ratingLabel}</span></div></div><div className="grid-3 testimonial-grid">{content.testimonial.items.map((item,index) => <article className={`card glass-card testimonial-card scroll-reveal scroll-delay-${(index%3)+1}`} data-scroll-reveal key={`${item.name}-${index}`}><div className="quote-mark">“</div><p>{item.text}</p><div className="testimonial-footer"><div><b>{item.name}</b><small>{item.role}</small></div><span className="stars">{"★".repeat(Math.max(0,Math.min(5,item.rating)))}</span></div></article>)}</div></div></section>

    <section id="faq" className="section section-soft faq-section"><div className="container"><div className="center-heading scroll-reveal" data-scroll-reveal><span className="eyebrow"><Headphones size={15}/> {content.faq.eyebrow}</span><h2>{content.faq.title}</h2><p className="muted">{content.faq.description}</p></div><div className="faq-grid">{content.faq.items.map((item,index) => <details className={`faq-item scroll-reveal scroll-delay-${(index%3)+1}`} data-scroll-reveal key={`${item.question}-${index}`}><summary>{item.question}<ChevronDown size={19}/></summary><p>{item.answer}</p></details>)}</div></div></section>

    <section id="mitra" className="section partner-section"><div className="container"><div className="partner-shell glass-card scroll-reveal" data-scroll-reveal><div className="partner-copy"><span className="eyebrow"><BriefcaseBusiness size={15}/> {content.partner.eyebrow}</span><h2>{content.partner.title}</h2><p className="muted">{content.partner.text}</p><div className="hero-buttons"><Link href="/login?mode=register" className="btn btn-primary"><UserPlus size={18}/> Daftar Mitra</Link><a href={whatsappHref} target="_blank" rel="noreferrer" className="btn btn-secondary">Tanya via WhatsApp</a></div></div><div className="partner-benefits">{content.partner.benefits.map((benefit,index) => <div className="partner-benefit" key={`${benefit.title}-${index}`}><span>{String(index+1).padStart(2,"0")}</span><div><b>{benefit.title}</b><p className="muted">{benefit.text}</p></div></div>)}</div></div></div></section>

    <section className="section dark-section"><div className="container"><div className="grid-3" style={{marginTop:0}}><div><span className="eyebrow">{content.vision.eyebrow}</span><h2>{content.vision.title}</h2></div><div className="card dark-glass"><h3>{content.vision.visionTitle}</h3><p className="muted">{content.vision.visionText}</p></div><div className="card dark-glass"><h3>{content.vision.missionTitle}</h3><p className="muted">{content.vision.missionText}</p></div></div></div></section>

    <section className="section"><div className="container"><div className="cta glass-cta"><div><span className="eyebrow">{content.cta.eyebrow}</span><h2 style={{marginBottom:10}}>{content.cta.title}</h2><p style={{margin:0}}>{content.cta.text}</p></div><div className="hero-buttons"><Link href="/lapor" className="btn btn-dark">{content.cta.primaryButtonLabel} <ArrowRight size={18}/></Link><a href={whatsappHref} target="_blank" rel="noreferrer" className="btn btn-whatsapp">{content.cta.secondaryButtonLabel} <MessageCircle size={18}/></a></div></div></div></section>

    <footer id="kontak" className="footer"><div className="container footer-grid"><div className="footer-company"><div className="footer-brand">{content.footer.brand}</div>{content.footer.description && <p className="footer-address">{content.footer.description}</p>}<p className="footer-address">{content.footer.address.split("\n").map((line,index,array) => <span key={index}>{line}{index < array.length-1 && <br/>}</span>)}</p><p className="footer-contact"><b>Phone:</b> {content.footer.phone}<br/><b>Email:</b> {content.footer.email}</p><div className="footer-socials" aria-label="Media sosial NyalaLagi">{content.footer.social.twitter && <a href={content.footer.social.twitter} target="_blank" rel="noreferrer" aria-label="X"><Twitter size={17}/></a>}{content.footer.social.facebook && <a href={content.footer.social.facebook} target="_blank" rel="noreferrer" aria-label="Facebook"><Facebook size={17}/></a>}{content.footer.social.instagram && <a href={content.footer.social.instagram} target="_blank" rel="noreferrer" aria-label="Instagram"><Instagram size={17}/></a>}{content.footer.social.linkedin && <a href={content.footer.social.linkedin} target="_blank" rel="noreferrer" aria-label="LinkedIn"><Linkedin size={17}/></a>}</div></div><div className="footer-column"><h3>{content.footer.webLinksTitle}</h3>{content.footer.webLinks.map((link,index) => <a href={link.href} key={`${link.label}-${index}`}>{link.label}</a>)}</div><div className="footer-column"><h3>{content.footer.serviceLinksTitle}</h3>{content.footer.serviceLinks.map((link,index) => <a href={link.href} key={`${link.label}-${index}`}>{link.label}</a>)}</div><div className="footer-newsletter"><h3>{content.footer.newsletterTitle}</h3><p>{content.footer.newsletterText}</p><form className="newsletter-form" onSubmit={event => event.preventDefault()}><input type="email" aria-label="Email newsletter" placeholder="Email Anda"/><button type="submit">{content.footer.newsletterButtonLabel}</button></form></div></div><div className="container footer-bottom"><small>© {new Date().getFullYear()} <strong>{content.footer.copyright}</strong></small></div></footer>

    {editorOpen && <CmsEditor content={content} initialTarget={editorTarget} onClose={() => { setEditorOpen(false); setEditorTarget(null); }}/>} 
  </main>;
}
