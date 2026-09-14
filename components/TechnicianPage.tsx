"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { collection, deleteDoc, doc, onSnapshot, query, serverTimestamp, setDoc, where } from "firebase/firestore";
import { ArrowLeft, Camera, CheckCircle2, LogOut, MapPin, Navigation, PlayCircle, RefreshCw, ShieldCheck, UserCog, Wrench, XCircle } from "lucide-react";
import { auth, db } from "@/lib/firebase";
import { getUserProfile } from "@/lib/user";
import { updateTechnicianStatus } from "@/lib/technician";
import { completeJob, saveJobPhotos, uploadJobPhotos } from "@/lib/job";
import type { ReportStatus } from "@/lib/report";

type Report = Record<string, any>;

const labels: Record<string, string> = {
  ENGINEER_ASSIGNED: "Pekerjaan ditugaskan",
  ENGINEER_ON_WAY: "Menuju lokasi",
  ARRIVED: "Sudah tiba",
  IN_PROGRESS: "Sedang dikerjakan",
  COMPLETED: "Selesai",
  REJECTED: "Ditolak"
};

const actions: Record<string, {status: ReportStatus; label: string; icon: any}[]> = {
  ENGINEER_ASSIGNED: [{status:"ENGINEER_ON_WAY", label:"Terima & berangkat", icon:Navigation}, {status:"REJECTED", label:"Tolak pekerjaan", icon:XCircle}],
  ENGINEER_ON_WAY: [{status:"ARRIVED", label:"Saya sudah tiba", icon:MapPin}, {status:"REJECTED", label:"Tolak pekerjaan", icon:XCircle}],
  ARRIVED: [{status:"IN_PROGRESS", label:"Mulai pengerjaan", icon:PlayCircle}, {status:"REJECTED", label:"Tidak dapat dikerjakan", icon:XCircle}],
  IN_PROGRESS: [{status:"COMPLETED", label:"Tandai selesai", icon:CheckCircle2}, {status:"REJECTED", label:"Batalkan pengerjaan", icon:XCircle}]
};

export default function TechnicianPage() {
  const [user, setUser] = useState<User|null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [reviews, setReviews] = useState<Report[]>([]);
  const [checking, setChecking] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [jobModal, setJobModal] = useState<Report | null>(null);
  const [jobPhotos, setJobPhotos] = useState<File[]>([]);
  const [completionNote, setCompletionNote] = useState("");
  const [photoBusy, setPhotoBusy] = useState(false);
  const watchRef = useRef<number | null>(null);
  const lastWriteRef = useRef<Record<string, {lat:number;lng:number;at:number}>>({});

  useEffect(() => {
    if (!auth) { setError("Firebase belum dikonfigurasi."); setChecking(false); return; }
    return onAuthStateChanged(auth, async u => {
      if (!u || u.isAnonymous) { window.location.href = "/login"; return; }
      try {
        const profile = await getUserProfile(u.uid);
        if (profile?.role !== "technician") { window.location.href = "/laporan"; return; }
        setProfile(profile);
        setUser(u);
      } catch { setError("Profil teknisi tidak dapat diverifikasi."); }
      finally { setChecking(false); }
    });
  }, []);

  useEffect(() => {
    if (!db || !user) return;
    const q = query(collection(db, "reports"), where("technicianId", "==", user.uid));
    return onSnapshot(q, snap => setReports(snap.docs.map(d => ({id:d.id, ...d.data()}))), err => setError(err.message));
  }, [user]);

  useEffect(() => {
    if (!db || !user) return;
    const unsubProfile = onSnapshot(doc(db, "users", user.uid), snap => setProfile(snap.exists() ? snap.data() : null));
    const q = query(collection(db, "technicianReviews"), where("technicianId", "==", user.uid));
    const unsubReviews = onSnapshot(q, snap => {
      const rows = snap.docs.map(d => ({id:d.id, ...d.data()}));
      rows.sort((a:any, b:any) => {
        const aa = a.createdAt?.toMillis?.() || 0;
        const bb = b.createdAt?.toMillis?.() || 0;
        return bb - aa;
      });
      setReviews(rows);
    }, err => setError(err.message));
    return () => { unsubProfile(); unsubReviews(); };
  }, [user]);

  const activeReports = useMemo(() => reports.filter(r => !["COMPLETED","REJECTED","CANCELLED"].includes(r.status)), [reports]);

  useEffect(() => {
    if (!db || !user) return;
    const firestore = db;
    const onWay = reports.filter(r => r.status === "ENGINEER_ON_WAY");
    if (!onWay.length || !navigator.geolocation) {
      if (watchRef.current != null) navigator.geolocation?.clearWatch(watchRef.current);
      watchRef.current = null;
      return;
    }

    const publish = (position: GeolocationPosition) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      const now = Date.now();
      onWay.forEach(r => {
        const previous = lastWriteRef.current[r.id];
        const distanceApprox = previous ? Math.hypot((lat - previous.lat) * 111000, (lng - previous.lng) * 111000) : Infinity;
        if (previous && now - previous.at < 10000 && distanceApprox < 25) return;
        lastWriteRef.current[r.id] = { lat, lng, at: now };
        setDoc(doc(firestore, "reportTracking", r.id), {
          reportId: r.id,
          customerId: r.customerId,
          technicianId: user.uid,
          latitude: lat,
          longitude: lng,
          accuracy: position.coords.accuracy || null,
          capturedAt: new Date(position.timestamp).toISOString(),
          updatedAt: serverTimestamp()
        }, { merge: true }).catch(() => undefined);
      });
    };

    if (watchRef.current == null) {
      watchRef.current = navigator.geolocation.watchPosition(publish, e => {
        setError(e.code === 1 ? "Izin lokasi ditolak. Aktifkan lokasi agar pelanggan dapat melacak perjalanan." : "GPS belum tersedia. Pastikan lokasi perangkat aktif.");
      }, { enableHighAccuracy: true, timeout: 20000, maximumAge: 5000 });
    }

    return () => {
      if (watchRef.current != null) navigator.geolocation.clearWatch(watchRef.current);
      watchRef.current = null;
    };
  }, [reports, user]);

  useEffect(() => {
    if (!db || !user) return;
    const firestore = db;
    const trackedIds = new Set(reports.filter(r => r.status === "ENGINEER_ON_WAY").map(r => r.id));
    reports.filter(r => ["ARRIVED","IN_PROGRESS","COMPLETED","REJECTED","CANCELLED"].includes(r.status)).forEach(r => {
      if (r.technicianId === user.uid) deleteDoc(doc(firestore, "reportTracking", r.id)).catch(() => undefined);
      delete lastWriteRef.current[r.id];
    });
    Object.keys(lastWriteRef.current).forEach(id => { if (!trackedIds.has(id)) delete lastWriteRef.current[id]; });
  }, [reports, user]);

  async function changeStatus(report: Report, next: ReportStatus) {
    try {
      setBusy(report.id); setError("");
      await updateTechnicianStatus(report.id, report.status, next);
    } catch (err: any) { setError(err?.message || "Status gagal diperbarui."); }
    finally { setBusy(""); }
  }

  function pickPhotos(e: React.ChangeEvent<HTMLInputElement>) {
    const incoming = Array.from(e.target.files ?? []).filter(f => f.type.startsWith("image/"));
    setJobPhotos(prev => [...prev, ...incoming].slice(0, 8));
  }

  async function saveBeforePhotos(report: Report) {
    if (!jobPhotos.length) return;
    try {
      setPhotoBusy(true); setError("");
      const urls = await uploadJobPhotos({ reportId: report.id, kind: "before", photos: jobPhotos, existingUrls: report.beforePhotoUrls || [] });
      await saveJobPhotos({ reportId: report.id, kind: "before", urls });
      setJobPhotos([]); setJobModal(null);
    } catch (err:any) { setError(err?.message || "Foto sebelum perbaikan gagal disimpan."); }
    finally { setPhotoBusy(false); }
  }

  async function finishJob(report: Report) {
    try {
      setPhotoBusy(true); setError("");
      const urls = await uploadJobPhotos({ reportId: report.id, kind: "after", photos: jobPhotos, existingUrls: report.afterPhotoUrls || [] });
      await completeJob({ reportId: report.id, currentStatus: report.status, afterPhotoUrls: urls, completionNote });
      setJobPhotos([]); setCompletionNote(""); setJobModal(null);
    } catch (err:any) { setError(err?.message || "Penyelesaian pekerjaan gagal disimpan."); }
    finally { setPhotoBusy(false); }
  }

  async function logout() { try { if (auth) await signOut(auth); } finally { window.location.href = "/"; } }

  if (checking) return <div className="admin-loading"><div className="admin-loader"/><b>Memverifikasi akses teknisi...</b></div>;

  return <div className="page-shell">
    <header className="app-header"><div className="container app-header-inner">
      <Link href="/" className="app-brand"><Image src="/company/logo.png" alt="NyalaLagi" width={38} height={38}/> NyalaLagi</Link>
      <div style={{display:"flex",gap:10,alignItems:"center",flexWrap:"wrap"}}><Link href="/" className="btn btn-secondary"><ArrowLeft size={16}/> Beranda</Link><button className="btn btn-primary" onClick={logout}><LogOut size={16}/> Keluar</button></div>
    </div></header>
    <main className="container form-wrap">
      <div style={{display:"flex",justifyContent:"space-between",gap:20,alignItems:"end",flexWrap:"wrap"}}>
        <div><span className="eyebrow"><ShieldCheck size={15}/> Teknisi NyalaLagi</span><h1 style={{fontSize:"clamp(34px,5vw,52px)",margin:"14px 0 8px"}}>Pekerjaan Saya</h1><p className="muted">Terima pekerjaan, berangkat ke lokasi, kerjakan dan selesaikan laporan secara realtime.</p></div>
        <div className="card" style={{padding:"12px 15px",display:"flex",gap:9,alignItems:"center"}}><UserCog size={18}/><b>{user?.email || "Teknisi"}</b></div>
      </div>
      {error && <div style={{background:"#fff0f0",color:"#a32626",padding:13,borderRadius:13,marginTop:18}}>{error}</div>}
      <section style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:12,marginTop:22}}>
        <div className="card"><small className="muted">Total tugas</small><h2 style={{margin:"6px 0 0"}}>{reports.length}</h2></div>
        <div className="card"><small className="muted">Aktif</small><h2 style={{margin:"6px 0 0"}}>{activeReports.length}</h2></div>
        <div className="card"><small className="muted">Selesai</small><h2 style={{margin:"6px 0 0"}}>{reports.filter(r=>r.status === "COMPLETED").length}</h2></div>
        <div className="card"><small className="muted">Rating pelanggan</small><h2 style={{margin:"6px 0 0"}}>★ {Number(profile?.ratingAverage || 0).toFixed(1)}</h2><small className="muted">{Number(profile?.ratingCount || 0)} penilaian</small></div>
      </section>
      {reviews.length > 0 && <section className="card" style={{marginTop:22}}>
        <div style={{display:"flex",justifyContent:"space-between",gap:12,alignItems:"center",flexWrap:"wrap"}}>
          <div><span className="eyebrow">⭐ Ulasan pelanggan</span><h3 style={{margin:"8px 0 4px"}}>Reputasi layanan Anda</h3><p className="muted" style={{margin:0}}>Rating diperbarui otomatis setelah pelanggan mengirim penilaian.</p></div>
          <strong style={{fontSize:24}}>★ {Number(profile?.ratingAverage || 0).toFixed(1)} <small className="muted" style={{fontSize:13}}>({Number(profile?.ratingCount || 0)})</small></strong>
        </div>
        <div style={{display:"grid",gap:10,marginTop:15}}>
          {reviews.slice(0,5).map((review:any) => <div key={review.id} style={{padding:"12px 14px",borderRadius:14,background:"var(--surface-2, rgba(99,102,241,.06))"}}>
            <div style={{display:"flex",justifyContent:"space-between",gap:10}}><b>{review.customerName || "Pelanggan"}</b><span aria-label={`${review.rating} dari 5 bintang`}>★ {review.rating}/5</span></div>
            {review.comment && <p className="muted" style={{margin:"6px 0 0",fontSize:13}}>{review.comment}</p>}
          </div>)}
        </div>
      </section>}
      <section style={{display:"grid",gap:15,marginTop:22}}>
        {reports.length === 0 ? <div className="card" style={{padding:45,textAlign:"center"}}><Wrench size={35}/><h3>Belum ada pekerjaan</h3><p className="muted">Pekerjaan yang ditugaskan admin akan muncul di sini secara realtime.</p></div> : reports.map(r => <article className="card" key={r.id}>
          <div style={{display:"flex",justifyContent:"space-between",gap:15,alignItems:"start",flexWrap:"wrap"}}><div><b style={{color:"var(--navy)"}}>NYL-{r.id.slice(0,8).toUpperCase()}</b><h3 style={{margin:"7px 0"}}>{r.problemType || "Gangguan listrik"}</h3></div><span className="status-pill status-process">{labels[r.status] || r.status}</span></div>
          <p className="muted">{r.description || "—"}</p>
          {r.customerName && <p><b>Pelanggan:</b> {r.customerName} {r.customerPhone ? `• ${r.customerPhone}` : ""}</p>}
          {r.location && <p className="muted" style={{fontSize:13}}><MapPin size={15} style={{verticalAlign:"middle",marginRight:5}}/>{r.location.address || `${Number(r.location.latitude).toFixed(5)}, ${Number(r.location.longitude).toFixed(5)}`}</p>}
          {actions[r.status]?.length ? <div style={{display:"flex",gap:10,flexWrap:"wrap",marginTop:15}}>{actions[r.status].map(a => { const Icon=a.icon; if (a.status === "COMPLETED") return <button key={a.status} className="btn btn-primary" disabled={busy===r.id} onClick={()=>{setJobModal(r);setJobPhotos([]);setCompletionNote(r.completionNote || "")}}><Icon size={16}/>Selesaikan & unggah bukti</button>; return <button key={a.status} className={`btn ${a.status === "REJECTED" ? "btn-secondary" : "btn-primary"}`} disabled={busy===r.id} onClick={()=>changeStatus(r,a.status)}><Icon size={16}/>{busy===r.id ? "Memproses..." : a.label}</button> })}</div> : null}
          {(r.status === "ARRIVED" || r.status === "IN_PROGRESS") && <div style={{marginTop:12}}><button className="btn btn-secondary" onClick={()=>{setJobModal(r);setJobPhotos([]);setCompletionNote("")}}>📷 Tambah foto sebelum perbaikan</button></div>}
          {r.beforePhotoUrls?.length > 0 && <div className="job-photo-strip"><b>Foto sebelum ({r.beforePhotoUrls.length})</b><div>{r.beforePhotoUrls.map((u:string)=><img key={u} src={u} alt="Sebelum perbaikan" loading="lazy"/>)}</div></div>}
          {r.afterPhotoUrls?.length > 0 && <div className="job-photo-strip"><b>Foto sesudah ({r.afterPhotoUrls.length})</b><div>{r.afterPhotoUrls.map((u:string)=><img key={u} src={u} alt="Sesudah perbaikan" loading="lazy"/>)}</div></div>}
          {r.completionNote && <div className="job-note"><b>Catatan hasil:</b> {r.completionNote}</div>}
        </article>)}
      </section>
      {jobModal && <div className="job-modal-backdrop" onClick={()=>!photoBusy && setJobModal(null)}><div className="job-modal" onClick={e=>e.stopPropagation()}>
        <div style={{display:"flex",justifyContent:"space-between",gap:12,alignItems:"center"}}><div><span className="eyebrow"><Camera size={16}/> Bukti pekerjaan</span><h3 style={{margin:"10px 0 4px"}}>{jobModal.status === "IN_PROGRESS" ? "Dokumentasi pekerjaan" : "Selesaikan pekerjaan"}</h3><p className="muted" style={{fontSize:13}}>Maksimal 8 foto per tahap.</p></div><button className="btn btn-secondary" onClick={()=>setJobModal(null)} disabled={photoBusy}>Tutup</button></div>
        <div className="job-photo-grid">{jobPhotos.map((f,i)=><div className="job-photo-preview" key={`${f.name}-${i}`}><img src={URL.createObjectURL(f)} alt="Preview"/><button onClick={()=>setJobPhotos(prev=>prev.filter((_,x)=>x!==i))}>×</button></div>)}<label className="job-photo-add">+<input type="file" accept="image/*" capture="environment" multiple onChange={pickPhotos}/></label></div>
        {jobModal.status === "IN_PROGRESS" && <div className="field"><label>Catatan hasil pekerjaan *</label><textarea className="textarea" value={completionNote} onChange={e=>setCompletionNote(e.target.value)} placeholder="Contoh: MCB diganti dan instalasi sudah diuji normal."/></div>}
        <div style={{display:"flex",gap:10,justifyContent:"flex-end",flexWrap:"wrap",marginTop:15}}>{jobModal.status === "IN_PROGRESS" ? <button className="btn btn-primary" disabled={photoBusy} onClick={()=>finishJob(jobModal)}><CheckCircle2 size={17}/>{photoBusy ? "Menyimpan..." : "Selesaikan pekerjaan"}</button> : <button className="btn btn-primary" disabled={photoBusy || !jobPhotos.length} onClick={()=>saveBeforePhotos(jobModal)}><Camera size={16}/>{photoBusy ? "Mengunggah..." : "Simpan foto sebelum"}</button>}</div>
      </div></div>}
      <p className="muted" style={{fontSize:12,textAlign:"center",marginTop:25}}><RefreshCw size={13} style={{verticalAlign:"middle"}}/> Data pekerjaan diperbarui realtime.</p>
    </main>
  </div>;
}
