"use client";

import { useState } from "react";
import { Check, ImagePlus, Loader2, Save, X } from "lucide-react";
import { SiteContent, saveSiteContent, uploadCMSImage } from "@/lib/cms";

type Target = { kind: "text" | "image"; path: string; label: string; imageSection?: string; imageIndex?: number };

function getAt(obj: any, path: string) { return path.split(".").reduce((v, k) => v?.[k], obj); }
function setAt(obj: any, path: string, value: any) {
  const keys = path.split("."); let cur = obj;
  keys.forEach((key, i) => { if (i === keys.length - 1) cur[key] = value; else cur = cur[key]; });
}
function clone<T>(v: T): T { return JSON.parse(JSON.stringify(v)); }

export default function CmsEditor({ content, onClose, initialTarget }: { content: SiteContent; onClose: () => void; initialTarget?: Target | null }) {
  const [draft, setDraft] = useState(() => clone(content));
  const [target, setTarget] = useState<Target | null>(initialTarget || null);
  const [value, setValue] = useState(() => initialTarget ? String(getAt(content, initialTarget.path) ?? "") : "");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function open(t: Target) { setTarget(t); setValue(String(getAt(draft, t.path) ?? "")); setError(""); setMessage(""); }
  function applyText() { if (!target) return; const next = clone(draft); setAt(next, target.path, value); setDraft(next); setMessage("Perubahan teks diterapkan. Klik Simpan untuk menerbitkan."); }
  async function handleImage(file: File) {
    if (!target) return;
    try { setUploading(true); setError(""); const url = await uploadCMSImage(file, target.imageSection || target.path.replaceAll(".", "-"), target.imageIndex); const next = clone(draft); setAt(next, target.path, url); setDraft(next); setValue(url); setMessage("Gambar berhasil diunggah."); }
    catch (e: any) { setError(e?.message || "Upload gambar gagal."); } finally { setUploading(false); }
  }
  async function save() {
    try { setSaving(true); setError(""); await saveSiteContent(draft); setMessage("CMS berhasil disimpan. Landing page akan memakai perubahan terbaru."); }
    catch (e: any) { setError(e?.message || "Gagal menyimpan CMS."); } finally { setSaving(false); }
  }

  return <div className="cms-modal-backdrop" onMouseDown={e => e.target === e.currentTarget && onClose()}>
    <div className="cms-modal">
      <header className="cms-modal-head"><div><span className="eyebrow">NYALALAGI CMS</span><h2>Edit Website</h2><p>Ubah tulisan dan gambar langsung tanpa menyentuh source code.</p></div><button className="cms-icon-button" onClick={onClose}><X size={19}/></button></header>
      <div className="cms-modal-body">
        <div className="cms-sidebar">
          <h3>Konten</h3>
          <button onClick={() => open({kind:"text",path:"hero.eyebrow",label:"Hero eyebrow"})}>Hero eyebrow</button>
          <button onClick={() => open({kind:"text",path:"hero.title",label:"Hero judul"})}>Hero judul</button>
          <button onClick={() => open({kind:"text",path:"hero.highlight",label:"Hero highlight"})}>Hero highlight</button>
          <button onClick={() => open({kind:"text",path:"hero.description",label:"Hero deskripsi"})}>Hero deskripsi</button>
          <button onClick={() => open({kind:"image",path:"hero.image",label:"Hero image",imageSection:"hero"})}>Hero image</button>
          <button onClick={() => open({kind:"text",path:"about.title",label:"Tentang judul"})}>Tentang</button>
          <button onClick={() => open({kind:"image",path:"about.image",label:"Tentang image",imageSection:"about"})}>Tentang image</button>
          {draft.services.map((s, i) => <button key={`s-${i}`} onClick={() => open({kind:"image",path:`services.${i}.image`,label:`Layanan ${i+1} image`,imageSection:"services",imageIndex:i})}>Layanan {i+1} image</button>)}
          {draft.portfolio.slice(0, 6).map((p, i) => <button key={`p-${i}`} onClick={() => open({kind:"image",path:`portfolio.${i}.image`,label:`Portfolio ${i+1} image`,imageSection:"portfolio",imageIndex:i})}>Portfolio {i+1} image</button>)}
          <button onClick={() => open({kind:"text",path:"partner.title",label:"Mitra teknisi"})}>Mitra teknisi</button>
          <button onClick={() => open({kind:"text",path:"vision.title",label:"Visi & Misi"})}>Visi & Misi</button>
          <button onClick={() => open({kind:"text",path:"cta.title",label:"CTA"})}>CTA</button>
          <button onClick={() => open({kind:"text",path:"footer.address",label:"Alamat footer"})}>Footer</button>
        </div>
        <div className="cms-editor-pane">
          {!target ? <div className="cms-empty"><ImagePlus size={30}/><h3>Pilih konten</h3><p>Pilih elemen di kiri untuk mengubahnya.</p></div> : <>
            <div className="cms-field-head"><div><span>EDIT</span><h3>{target.label}</h3></div>{target.kind === "text" && <button className="btn btn-secondary" onClick={applyText}><Check size={16}/> Terapkan</button>}</div>
            {target.kind === "text" ? <textarea className="cms-textarea" value={value} onChange={e=>setValue(e.target.value)} rows={9}/> : <div className="cms-image-editor"><div className="cms-preview-image">{value ? <img src={value} alt="Preview"/> : <ImagePlus size={42}/>}</div><label className="cms-upload"><ImagePlus size={18}/><span>{uploading ? "Mengunggah..." : "Ganti gambar"}</span><input type="file" accept="image/*" disabled={uploading} onChange={e=>e.target.files?.[0] && handleImage(e.target.files[0])}/></label><small>JPG, PNG, WEBP. Gunakan gambar dengan rasio sesuai area agar hasil tetap rapi.</small></div>}
          </>}
          {message && <div className="cms-message success">{message}</div>}{error && <div className="cms-message error">{error}</div>}
        </div>
      </div>
      <footer className="cms-modal-foot"><span>Perubahan tersimpan di Firestore dan gambar di Firebase Storage.</span><button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? <><Loader2 size={17} className="spin"/> Menyimpan...</> : <><Save size={17}/> Simpan Perubahan</>}</button></footer>
    </div>
  </div>;
}
