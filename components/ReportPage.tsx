 "use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Camera, CheckCircle2, Loader2, MapPin, Send, X, Zap, LogOut } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth, firebaseReady } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { createReport } from "@/lib/report";
import LocationPicker from "./LocationPicker";

const problems = [
  "Listrik padam total", "Sebagian listrik mati", "MCB turun",
  "Korsleting", "Stop kontak bermasalah", "Lampu tidak menyala",
  "Kabel / instalasi bermasalah", "Lainnya"
];

export default function ReportPage() {
  const [user,setUser] = useState<User|null>(null);
  const [name,setName] = useState("");
  const [phone,setPhone] = useState("");
  const [problem,setProblem] = useState("");
  const [description,setDescription] = useState("");
  const [address,setAddress] = useState("");
  const [lat,setLat] = useState<number|null>(null);
  const [lng,setLng] = useState<number|null>(null);
  const [accuracy,setAccuracy] = useState<number|undefined>();
  const [photos,setPhotos] = useState<File[]>([]);
  const [sending,setSending] = useState(false);
  const [done,setDone] = useState("");
  const [error,setError] = useState("");

  useEffect(() => {
    const firebaseAuth = auth;
    if (!firebaseAuth) return;

    return onAuthStateChanged(firebaseAuth, (u) => {
      if (u && !u.isAnonymous) setUser(u);
      else window.location.href = "/login";
    });
  }, []);

  const previews = useMemo(() => photos.map(f => ({file:f,url:URL.createObjectURL(f)})), [photos]);

  function addPhotos(e: React.ChangeEvent<HTMLInputElement>) {
    const incoming = Array.from(e.target.files ?? []).filter(f => f.type.startsWith("image/"));
    setPhotos(prev => [...prev, ...incoming].slice(0,5));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!firebaseReady || !user) return setError("Firebase belum siap. Periksa konfigurasi .env.local dan koneksi.");
    if (!name.trim() || !phone.trim()) return setError("Nama dan nomor WhatsApp wajib diisi.");
    if (!problem) return setError("Pilih jenis masalah listrik.");
    if (!lat || !lng) return setError("Silakan ambil atau pilih lokasi perbaikan di peta.");
    if (!description.trim()) return setError("Jelaskan masalah listrik Anda.");
    try {
      setSending(true);
      const id = await createReport({
        uid:user.uid, name, phone, problemType:problem, description,
        location:{latitude:lat, longitude:lng, accuracy, capturedAt:new Date().toISOString(), address},
        photos
      });
      setDone(id);
    } catch (err:any) {
      setError(err?.message || "Laporan gagal dikirim.");
    } finally { setSending(false); }
  }

  async function logout() {
    try { if (auth) await signOut(auth); } finally { window.location.href = "/"; }
  }

  if (done) return (
    <div className="page-shell">
      <header className="app-header"><div className="container app-header-inner">
        <Link href="/" className="app-brand"><Image src="/company/logo.png" alt="" width={38} height={38}/> NyalaLagi</Link>
        <button type="button" className="btn btn-primary" onClick={logout}><LogOut size={16}/> Keluar</button>
      </div></header>
      <div className="container form-wrap">
        <div className="form-card" style={{maxWidth:650,margin:"60px auto",textAlign:"center"}}>
          <CheckCircle2 size={70} style={{color:"var(--green)"}}/>
          <h1 style={{fontSize:40,marginTop:18}}>Laporan berhasil dibuat</h1>
          <p className="muted">Permintaan Anda sudah masuk ke sistem NyalaLagi.</p>
          <div className="location-box" style={{textAlign:"left",margin:"24px 0"}}>
            <b>Nomor laporan</b>
            <div style={{fontSize:22,fontWeight:900,marginTop:6}}>NYL-{done.slice(0,8).toUpperCase()}</div>
            <p className="muted" style={{margin:"10px 0 0"}}>Status awal: Mencari teknisi terdekat.</p>
          </div>
          <div style={{display:"flex",gap:10,justifyContent:"center",flexWrap:"wrap"}}>
            <Link href="/laporan" className="btn btn-primary">Lihat laporan</Link>
            <Link href="/" className="btn btn-secondary">Kembali ke beranda</Link>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="page-shell">
      <header className="app-header"><div className="container app-header-inner">
        <Link href="/" className="app-brand"><Image src="/company/logo.png" alt="" width={38} height={38}/> NyalaLagi</Link>
        <div style={{display:"flex",gap:10,alignItems:"center",flexWrap:"wrap"}}>
          <Link href="/" className="btn btn-secondary"><ArrowLeft size={16}/> Beranda</Link>
          <button type="button" className="btn btn-primary" onClick={logout}><LogOut size={16}/> Keluar</button>
        </div>
      </div></header>

      <main className="container form-wrap">
        <div style={{marginBottom:24}}>
          <span className="eyebrow"><Zap size={15}/> Laporan gangguan</span>
          <h1 style={{fontSize:"clamp(34px,5vw,54px)",margin:"15px 0 10px"}}>Laporkan masalah listrik</h1>
          <p className="muted">Isi masalah, lokasi perbaikan dan foto kerusakan. Lokasi GPS membantu sistem menemukan teknisi terdekat.</p>
        </div>

        <form onSubmit={submit} className="form-layout">
          <div className="form-card">
            <div className="field">
              <label>Nama pelanggan *</label>
              <input className="input" value={name} onChange={e=>setName(e.target.value)} placeholder="Nama lengkap"/>
            </div>
            <div className="field">
              <label>Nomor WhatsApp *</label>
              <input className="input" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="08xxxxxxxxxx" inputMode="tel"/>
            </div>
            <div className="field">
              <label>Jenis masalah *</label>
              <div className="problem-grid">
                {problems.map(p => <button type="button" key={p} className={`problem-option ${problem===p?"active":""}`} onClick={()=>setProblem(p)}>{p}</button>)}
              </div>
            </div>
            <div className="field">
              <label>Deskripsi masalah *</label>
              <textarea className="textarea" value={description} onChange={e=>setDescription(e.target.value)} placeholder="Contoh: listrik rumah tiba-tiba mati sejak pukul 19.00, MCB sudah dicek..."/>
            </div>
            <div className="field">
              <label>Foto kerusakan</label>
              <div className="photo-grid">
                {previews.map((p,i)=><div className="photo-item" key={p.url}><img src={p.url} alt="Preview"/><button type="button" className="remove-photo" onClick={()=>setPhotos(prev=>prev.filter((_,x)=>x!==i))}><X size={14}/></button></div>)}
                {photos.length<5 && <label className="photo-item" style={{display:"grid",placeItems:"center",cursor:"pointer",background:"#fafbff"}}><Camera/><input type="file" accept="image/*" capture="environment" multiple onChange={addPhotos} style={{display:"none"}}/></label>}
              </div>
              <small className="muted">Maksimal 5 foto. Anda dapat mengambil foto langsung dari kamera HP.</small>
            </div>
          </div>

          <div className="form-card">
            <h3><MapPin size={18} style={{verticalAlign:"middle",marginRight:7}}/> Lokasi perbaikan</h3>
            <p className="muted" style={{fontSize:13}}>Izinkan akses lokasi untuk mengirim koordinat dan akurasi GPS saat laporan dibuat.</p>
            <LocationPicker latitude={lat} longitude={lng} onChange={(a,b,c)=>{setLat(a);setLng(b);setAccuracy(c)}}/>
            <div className="field" style={{marginTop:18}}>
              <label>Alamat / patokan tambahan</label>
              <textarea className="textarea" style={{minHeight:90}} value={address} onChange={e=>setAddress(e.target.value)} placeholder="Nama jalan, nomor rumah, patokan, dll."/>
            </div>
            {accuracy != null && <p className="muted" style={{fontSize:12}}>Akurasi GPS saat diambil: ±{Math.round(accuracy)} meter.</p>}
            {error && <div style={{background:"#fff0f0",color:"#a32626",padding:13,borderRadius:13,margin:"15px 0"}}>{error}</div>}
            <button disabled={sending} className="btn btn-primary" style={{width:"100%",marginTop:5}}>
              {sending ? <><Loader2 size={18} className="spin"/> Mengirim...</> : <><Send size={18}/> Kirim Laporan</>}
            </button>
            <p className="muted" style={{fontSize:11,textAlign:"center",marginTop:10}}>Dengan mengirim laporan, data lokasi dan foto digunakan untuk proses pelayanan NyalaLagi.</p>
          </div>
        </form>
      </main>
    </div>
  );
}
