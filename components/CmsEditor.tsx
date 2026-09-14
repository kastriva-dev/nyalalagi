"use client";

import { useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  FileText,
  ImagePlus,
  LayoutTemplate,
  Loader2,
  MinusCircle,
  Plus,
  Save,
  Search,
  Settings2,
  X
} from "lucide-react";
import { SiteContent, saveSiteContent, uploadCMSImage, mergeContent } from "@/lib/cms";

type Target = { kind: "text" | "image"; path: string; label: string; imageSection?: string; imageIndex?: number };
type SectionKey = "hero" | "about" | "advantages" | "services" | "portfolio" | "process" | "testimonial" | "technicians" | "faq" | "cta" | "footer" | "seo";

const SECTIONS: { key: SectionKey; label: string; hint: string }[] = [
  { key: "hero", label: "Hero", hint: "Headline, CTA, trust & background" },
  { key: "about", label: "Tentang", hint: "Profil, janji & foto" },
  { key: "advantages", label: "Keunggulan", hint: "Judul dan kartu keunggulan" },
  { key: "services", label: "Layanan", hint: "Daftar layanan dan gambar" },
  { key: "portfolio", label: "Portfolio", hint: "Galeri pekerjaan" },
  { key: "process", label: "Cara Kerja", hint: "Tahapan pelayanan" },
  { key: "testimonial", label: "Testimonial", hint: "Ulasan dan rating" },
  { key: "technicians", label: "Teknisi", hint: "Section kepercayaan teknisi" },
  { key: "faq", label: "FAQ", hint: "Pertanyaan dan jawaban" },
  { key: "cta", label: "CTA", hint: "Ajakan membuat laporan" },
  { key: "footer", label: "Footer", hint: "Kontak, link & sosial" },
  { key: "seo", label: "SEO", hint: "Google, Open Graph & robots" }
];

function clone<T>(value: T): T { return JSON.parse(JSON.stringify(value)); }
function getAt(obj: any, path: string) { return path.split(".").reduce((value, key) => value?.[key], obj); }
function setAt(obj: any, path: string, value: any) {
  const keys = path.split(".");
  let current = obj;
  keys.forEach((key, index) => {
    if (index === keys.length - 1) current[key] = value;
    else current = current[key];
  });
}

export default function CmsEditor({ content, onClose, initialTarget }: { content: SiteContent; onClose: () => void; initialTarget?: Target | null }) {
  const normalized = useMemo(() => mergeContent(content), [content]);
  const [draft, setDraft] = useState<SiteContent>(() => clone(normalized));
  const initialSection = (initialTarget?.path.split(".")[0] || "hero") as SectionKey;
  const [section, setSection] = useState<SectionKey>(SECTIONS.some(s => s.key === initialSection) ? initialSection : "hero");
  const [saving, setSaving] = useState(false);
  const [uploadingPath, setUploadingPath] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function update(path: string, value: any) {
    setDraft(previous => {
      const next = clone(previous);
      setAt(next, path, value);
      return next;
    });
    setMessage("");
  }

  function addItem(path: string, item: any) {
    const list = Array.isArray(getAt(draft, path)) ? getAt(draft, path) : [];
    update(path, [...list, item]);
  }

  function removeItem(path: string, index: number) {
    const list = [...(getAt(draft, path) || [])];
    list.splice(index, 1);
    update(path, list);
  }

  function moveItem(path: string, index: number, direction: -1 | 1) {
    const list = [...(getAt(draft, path) || [])];
    const to = index + direction;
    if (to < 0 || to >= list.length) return;
    [list[index], list[to]] = [list[to], list[index]];
    update(path, list);
  }

  async function upload(path: string, sectionName: string, index: number | undefined, file?: File) {
    if (!file) return;
    try {
      setUploadingPath(path);
      setError("");
      const url = await uploadCMSImage(file, sectionName, index);
      update(path, url);
      setMessage("Gambar berhasil diunggah. Klik Simpan Perubahan untuk menerbitkan.");
    } catch (e: any) {
      setError(e?.message || "Upload gambar gagal.");
    } finally {
      setUploadingPath("");
    }
  }

  async function save() {
    try {
      setSaving(true);
      setError("");
      const next = mergeContent(draft);
      setDraft(next);
      await saveSiteContent(next);
      setMessage("Perubahan CMS berhasil diterbitkan ke website.");
    } catch (e: any) {
      setError(e?.message || "Gagal menyimpan CMS.");
    } finally {
      setSaving(false);
    }
  }

  const TextField = ({ label, path, multiline = false, hint }: { label: string; path: string; multiline?: boolean; hint?: string }) => (
    <label className="cms-v2-field">
      <span>{label}</span>
      {multiline ? <textarea rows={4} value={String(getAt(draft, path) ?? "")} onChange={e => update(path, e.target.value)} /> : <input value={String(getAt(draft, path) ?? "")} onChange={e => update(path, e.target.value)} />}
      {hint && <small>{hint}</small>}
    </label>
  );

  const ImageField = ({ label, path, sectionName, index }: { label: string; path: string; sectionName: string; index?: number }) => {
    const src = String(getAt(draft, path) || "");
    return <div className="cms-v2-image-field">
      <div className="cms-v2-label">{label}</div>
      <div className="cms-v2-image-preview">{src ? <img src={src} alt={label}/> : <ImagePlus size={34}/>}</div>
      <div className="cms-v2-image-actions">
        <input value={src} onChange={e => update(path, e.target.value)} placeholder="URL gambar atau upload file" />
        <label className="cms-v2-upload"><ImagePlus size={16}/>{uploadingPath === path ? "Mengunggah..." : "Upload"}<input type="file" accept="image/*" disabled={!!uploadingPath} onChange={e => upload(path, sectionName, index, e.target.files?.[0])}/></label>
      </div>
    </div>;
  };

  const ListToolbar = ({ path, index }: { path: string; index: number }) => <div className="cms-v2-item-actions">
    <button type="button" title="Naik" onClick={() => moveItem(path, index, -1)}><ChevronUp size={15}/></button>
    <button type="button" title="Turun" onClick={() => moveItem(path, index, 1)}><ChevronDown size={15}/></button>
    <button type="button" className="danger" title="Hapus" onClick={() => removeItem(path, index)}><MinusCircle size={15}/></button>
  </div>;

  function renderSection() {
    switch (section) {
      case "hero": return <>
        <SectionIntro title="Hero" text="Konten pertama yang dilihat pengunjung. Headline dan CTA harus langsung menjelaskan fungsi NyalaLagi."/>
        <div className="cms-v2-grid"><TextField label="Eyebrow" path="hero.eyebrow"/><TextField label="Headline baris 1" path="hero.title"/><TextField label="Headline highlight" path="hero.highlight"/><TextField label="Deskripsi" path="hero.description" multiline/><TextField label="Tombol Website" path="hero.primaryButtonLabel"/><TextField label="Tombol WhatsApp" path="hero.secondaryButtonLabel"/></div>
        <ImageField label="Background Hero" path="hero.image" sectionName="hero"/>
        <StringList title="Trust badge" path="hero.trustItems" values={draft.hero.trustItems} update={update}/>
      </>;
      case "about": return <>
        <SectionIntro title="Tentang" text="Ubah narasi perusahaan, promise, poin kepercayaan dan gambar section Tentang."/>
        <div className="cms-v2-grid"><TextField label="Eyebrow" path="about.eyebrow"/><TextField label="Judul" path="about.title"/><TextField label="Paragraf 1" path="about.text1" multiline/><TextField label="Paragraf 2" path="about.text2" multiline/><TextField label="Label promise" path="about.promiseLabel"/><TextField label="Judul promise" path="about.promiseTitle" multiline/></div>
        <ImageField label="Gambar Tentang" path="about.image" sectionName="about"/>
        <StringList title="Poin promise" path="about.points" values={draft.about.points} update={update}/>
        <div className="cms-v2-subsection"><h4>Visi & Misi (section lama tetap dipertahankan)</h4><div className="cms-v2-grid"><TextField label="Judul Visi & Misi" path="vision.title"/><TextField label="Visi" path="vision.visionText" multiline/><TextField label="Misi" path="vision.missionText" multiline/></div></div>
      </>;
      case "advantages": return <>
        <SectionIntro title="Keunggulan" text="Kelola heading dan kartu nilai utama NyalaLagi."/>
        <div className="cms-v2-grid"><TextField label="Eyebrow" path="advantages.eyebrow"/><TextField label="Judul" path="advantages.title"/><TextField label="Deskripsi" path="advantages.description" multiline/></div>
        <div className="cms-v2-list">{draft.advantages.items.map((item, i) => <article className="cms-v2-item" key={i}><ListToolbar path="advantages.items" index={i}/><TextField label={`Keunggulan ${i+1}`} path={`advantages.items.${i}.title`}/><TextField label="Deskripsi" path={`advantages.items.${i}.text`} multiline/></article>)}</div>
        <AddButton onClick={() => addItem("advantages.items", { title: "Keunggulan Baru", text: "Deskripsi keunggulan." })}>Tambah Keunggulan</AddButton>
      </>;
      case "services": return <>
        <SectionIntro title="Layanan" text="Tambah, hapus, urutkan dan ganti gambar layanan tanpa mengubah source code."/>
        <div className="cms-v2-grid"><TextField label="Eyebrow" path="services.eyebrow"/><TextField label="Judul" path="services.title"/><TextField label="Deskripsi" path="services.description" multiline/><TextField label="Label link layanan" path="services.buttonLabel"/></div>
        <div className="cms-v2-list">{draft.services.items.map((item, i) => <article className="cms-v2-item" key={i}><ListToolbar path="services.items" index={i}/><TextField label={`Nama layanan ${i+1}`} path={`services.items.${i}.title`}/><TextField label="Deskripsi" path={`services.items.${i}.text`} multiline/><ImageField label="Gambar layanan" path={`services.items.${i}.image`} sectionName="services" index={i}/></article>)}</div>
        <AddButton onClick={() => addItem("services.items", { title: "Layanan Baru", text: "Deskripsi layanan.", image: "/company/nyala-service-1.jpg" })}>Tambah Layanan</AddButton>
      </>;
      case "portfolio": return <>
        <SectionIntro title="Portfolio" text="Galeri pekerjaan dapat ditambah dan diurutkan sesuai kebutuhan."/>
        <div className="cms-v2-grid"><TextField label="Eyebrow" path="portfolio.eyebrow"/><TextField label="Judul" path="portfolio.title"/><TextField label="Deskripsi" path="portfolio.description" multiline/></div>
        <div className="cms-v2-list cms-v2-list-two">{draft.portfolio.items.map((item, i) => <article className="cms-v2-item" key={i}><ListToolbar path="portfolio.items" index={i}/><TextField label={`Judul portfolio ${i+1}`} path={`portfolio.items.${i}.title`}/><TextField label="Kategori" path={`portfolio.items.${i}.category`}/><ImageField label="Gambar" path={`portfolio.items.${i}.image`} sectionName="portfolio" index={i}/></article>)}</div>
        <AddButton onClick={() => addItem("portfolio.items", { title: "Portfolio Baru", category: "Kelistrikan", image: "/company/nyala-portfolio-1.jpg" })}>Tambah Portfolio</AddButton>
      </>;
      case "process": return <>
        <SectionIntro title="Cara Kerja" text="Tahapan yang menjelaskan alur layanan kepada customer."/>
        <div className="cms-v2-grid"><TextField label="Eyebrow" path="process.eyebrow"/><TextField label="Judul" path="process.title"/><TextField label="Deskripsi" path="process.description" multiline/></div>
        <div className="cms-v2-list">{draft.process.items.map((item, i) => <article className="cms-v2-item" key={i}><ListToolbar path="process.items" index={i}/><TextField label={`Langkah ${i+1}`} path={`process.items.${i}.title`}/><TextField label="Penjelasan" path={`process.items.${i}.text`} multiline/></article>)}</div>
        <AddButton onClick={() => addItem("process.items", { title: "Langkah Baru", text: "Penjelasan langkah." })}>Tambah Langkah</AddButton>
      </>;
      case "testimonial": return <>
        <SectionIntro title="Testimonial" text="Kelola rating ringkas dan testimonial yang tampil di landing page."/>
        <div className="cms-v2-grid"><TextField label="Eyebrow" path="testimonial.eyebrow"/><TextField label="Judul" path="testimonial.title"/><TextField label="Deskripsi" path="testimonial.description" multiline/><TextField label="Rating utama" path="testimonial.rating"/><TextField label="Label rating" path="testimonial.ratingLabel"/></div>
        <div className="cms-v2-list">{draft.testimonial.items.map((item, i) => <article className="cms-v2-item" key={i}><ListToolbar path="testimonial.items" index={i}/><TextField label="Nama" path={`testimonial.items.${i}.name`}/><TextField label="Keterangan/role" path={`testimonial.items.${i}.role`}/><TextField label="Testimonial" path={`testimonial.items.${i}.text`} multiline/><label className="cms-v2-field"><span>Rating (1-5)</span><input type="number" min="1" max="5" value={item.rating} onChange={e => update(`testimonial.items.${i}.rating`, Math.max(1, Math.min(5, Number(e.target.value) || 5)))}/></label></article>)}</div>
        <AddButton onClick={() => addItem("testimonial.items", { name: "Pelanggan", role: "Pelanggan", text: "Pengalaman menggunakan NyalaLagi.", rating: 5 })}>Tambah Testimonial</AddButton>
      </>;
      case "technicians": return <>
        <SectionIntro title="Teknisi" text="Konten trust section teknisi dan informasi singkat kartu mitra."/>
        <div className="cms-v2-grid"><TextField label="Eyebrow" path="technicians.eyebrow"/><TextField label="Judul" path="technicians.title"/><TextField label="Deskripsi" path="technicians.description" multiline/><TextField label="Label tombol" path="technicians.buttonLabel"/><TextField label="Status kartu" path="technicians.statusLabel"/><TextField label="Judul kartu" path="technicians.cardTitle"/><TextField label="Teks kartu" path="technicians.cardText" multiline/></div>
        <StringList title="Poin kepercayaan" path="technicians.points" values={draft.technicians.points} update={update}/>
        <StringList title="Langkah kartu teknisi" path="technicians.cardSteps" values={draft.technicians.cardSteps} update={update}/>
        <div className="cms-v2-subsection"><h4>Mitra Teknisi (section lama tetap dipertahankan)</h4><div className="cms-v2-grid"><TextField label="Judul Mitra" path="partner.title"/><TextField label="Deskripsi Mitra" path="partner.text" multiline/></div></div>
      </>;
      case "faq": return <>
        <SectionIntro title="FAQ" text="Tambah pertanyaan yang sering ditanyakan dan jawabannya."/>
        <div className="cms-v2-grid"><TextField label="Eyebrow" path="faq.eyebrow"/><TextField label="Judul" path="faq.title"/><TextField label="Deskripsi" path="faq.description" multiline/></div>
        <div className="cms-v2-list">{draft.faq.items.map((item, i) => <article className="cms-v2-item" key={i}><ListToolbar path="faq.items" index={i}/><TextField label={`Pertanyaan ${i+1}`} path={`faq.items.${i}.question`}/><TextField label="Jawaban" path={`faq.items.${i}.answer`} multiline/></article>)}</div>
        <AddButton onClick={() => addItem("faq.items", { question: "Pertanyaan baru?", answer: "Jawaban pertanyaan." })}>Tambah FAQ</AddButton>
      </>;
      case "cta": return <>
        <SectionIntro title="CTA" text="Ajakan terakhir sebelum footer agar pengunjung membuat laporan."/>
        <div className="cms-v2-grid"><TextField label="Eyebrow" path="cta.eyebrow"/><TextField label="Judul" path="cta.title"/><TextField label="Deskripsi" path="cta.text" multiline/><TextField label="Tombol utama" path="cta.primaryButtonLabel"/><TextField label="Tombol WhatsApp" path="cta.secondaryButtonLabel"/></div>
      </>;
      case "footer": return <>
        <SectionIntro title="Footer" text="Kontak perusahaan, link navigasi, newsletter dan media sosial."/>
        <div className="cms-v2-grid"><TextField label="Brand" path="footer.brand"/><TextField label="Deskripsi singkat" path="footer.description" multiline/><TextField label="Alamat" path="footer.address" multiline/><TextField label="Telepon" path="footer.phone"/><TextField label="Email" path="footer.email"/><TextField label="Judul link web" path="footer.webLinksTitle"/><TextField label="Judul link layanan" path="footer.serviceLinksTitle"/><TextField label="Newsletter title" path="footer.newsletterTitle"/><TextField label="Newsletter text" path="footer.newsletterText" multiline/><TextField label="Label subscribe" path="footer.newsletterButtonLabel"/><TextField label="Copyright" path="footer.copyright"/></div>
        <LinkList title="Tautan Web" path="footer.webLinks" values={draft.footer.webLinks} update={update}/>
        <LinkList title="Tautan Layanan" path="footer.serviceLinks" values={draft.footer.serviceLinks} update={update}/>
        <div className="cms-v2-subsection"><h4>Media sosial</h4><div className="cms-v2-grid"><TextField label="X / Twitter URL" path="footer.social.twitter"/><TextField label="Facebook URL" path="footer.social.facebook"/><TextField label="Instagram URL" path="footer.social.instagram"/><TextField label="LinkedIn URL" path="footer.social.linkedin"/></div></div>
      </>;
      case "seo": return <>
        <SectionIntro title="SEO" text="Metadata ini dipakai untuk Google, hasil share sosial dan kontrol indexing. SEO memiliki fallback aman bila field kosong." icon="seo"/>
        <div className="cms-v2-grid"><TextField label="SEO title" path="seo.title" hint="Disarankan sekitar 50–60 karakter."/><TextField label="Meta description" path="seo.description" multiline hint="Disarankan sekitar 140–160 karakter."/><TextField label="Keywords" path="seo.keywords" multiline hint="Pisahkan dengan koma."/><TextField label="Canonical URL" path="seo.canonicalUrl" hint="Contoh: https://nyalalagi.com"/><TextField label="Open Graph title" path="seo.ogTitle"/><TextField label="Open Graph description" path="seo.ogDescription" multiline/></div>
        <ImageField label="Open Graph image" path="seo.ogImage" sectionName="seo"/>
        <div className="cms-v2-toggle-row"><label><input type="checkbox" checked={draft.seo.robotsIndex} onChange={e => update("seo.robotsIndex", e.target.checked)}/><span>Izinkan mesin pencari meng-index halaman</span></label><label><input type="checkbox" checked={draft.seo.robotsFollow} onChange={e => update("seo.robotsFollow", e.target.checked)}/><span>Izinkan mesin pencari mengikuti link</span></label></div>
        <div className="cms-v2-serp"><small>Preview Google</small><strong>{draft.seo.title || "NyalaLagi"}</strong><span>{draft.seo.canonicalUrl || "https://nyalalagi.com"}</span><p>{draft.seo.description}</p></div>
      </>;
    }
  }

  return <div className="cms-modal-backdrop cms-v2-backdrop" onMouseDown={e => e.target === e.currentTarget && onClose()}>
    <div className="cms-modal cms-v2-modal">
      <header className="cms-modal-head cms-v2-head">
        <div><span className="eyebrow"><Settings2 size={14}/> NYALALAGI CMS · TAHAP 10</span><h2>Kelola Website</h2><p>Semua section utama landing page dapat diubah tanpa edit source code.</p></div>
        <button className="cms-icon-button" onClick={onClose} aria-label="Tutup CMS"><X size={19}/></button>
      </header>
      <div className="cms-modal-body cms-v2-body">
        <aside className="cms-sidebar cms-v2-sidebar"><h3>WEBSITE</h3>{SECTIONS.map(item => <button key={item.key} className={section === item.key ? "active" : ""} onClick={() => setSection(item.key)}><span>{item.label}</span><small>{item.hint}</small></button>)}</aside>
        <section className="cms-editor-pane cms-v2-pane">{renderSection()}{message && <div className="cms-message success">{message}</div>}{error && <div className="cms-message error">{error}</div>}</section>
      </div>
      <footer className="cms-modal-foot cms-v2-foot"><div><FileText size={15}/><span>Firestore: <b>siteContent/main</b> · Perubahan baru aktif setelah disimpan.</span></div><button className="btn btn-primary" onClick={save} disabled={saving || !!uploadingPath}>{saving ? <><Loader2 size={17} className="spin"/> Menyimpan...</> : <><Save size={17}/> Simpan Perubahan</>}</button></footer>
    </div>
  </div>;
}

function SectionIntro({ title, text, icon }: { title: string; text: string; icon?: string }) {
  return <div className="cms-v2-section-intro"><div className="cms-v2-section-icon">{icon === "seo" ? <Search size={20}/> : <LayoutTemplate size={20}/>}</div><div><h3>{title}</h3><p>{text}</p></div></div>;
}

function AddButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return <button type="button" className="cms-v2-add" onClick={onClick}><Plus size={16}/>{children}</button>;
}

function StringList({ title, path, values, update }: { title: string; path: string; values: string[]; update: (path: string, value: any) => void }) {
  const set = (index: number, value: string) => { const next = [...values]; next[index] = value; update(path, next); };
  const remove = (index: number) => update(path, values.filter((_, i) => i !== index));
  return <div className="cms-v2-subsection"><h4>{title}</h4><div className="cms-v2-simple-list">{values.map((value, i) => <div key={i}><input value={value} onChange={e => set(i, e.target.value)}/><button type="button" onClick={() => remove(i)} aria-label="Hapus"><X size={15}/></button></div>)}</div><AddButton onClick={() => update(path, [...values, "Item baru"])}>Tambah Item</AddButton></div>;
}

function LinkList({ title, path, values, update }: { title: string; path: string; values: { label: string; href: string }[]; update: (path: string, value: any) => void }) {
  const set = (index: number, field: "label" | "href", value: string) => { const next = values.map((item, i) => i === index ? { ...item, [field]: value } : item); update(path, next); };
  const remove = (index: number) => update(path, values.filter((_, i) => i !== index));
  return <div className="cms-v2-subsection"><h4>{title}</h4><div className="cms-v2-link-list">{values.map((item, i) => <div key={i}><input value={item.label} onChange={e => set(i, "label", e.target.value)} placeholder="Label"/><input value={item.href} onChange={e => set(i, "href", e.target.value)} placeholder="#section atau URL"/><button type="button" onClick={() => remove(i)}><X size={15}/></button></div>)}</div><AddButton onClick={() => update(path, [...values, { label: "Link Baru", href: "#" }])}>Tambah Link</AddButton></div>;
}
