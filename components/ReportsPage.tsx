 "use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Clock3, MapPin, RefreshCw, LogOut, Navigation, UserRound, Star, CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { collection, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import LiveTechnicianMap from "@/components/LiveTechnicianMap";
import { confirmJobByCustomer } from "@/lib/job";

function statusLabel(status:string) {
  const m:any = {
    SEARCHING_ENGINEER:["Mencari teknisi","status-open"],
    ENGINEER_ASSIGNED:["Teknisi ditemukan","status-process"],
    ENGINEER_ON_WAY:["Teknisi menuju lokasi","status-process"],
    ARRIVED:["Teknisi sudah tiba","status-process"],
    IN_PROGRESS:["Dalam pengerjaan","status-process"],
    REJECTED:["Pekerjaan ditolak teknisi","status-open"],
    COMPLETED:["Selesai","status-done"],
    CANCELLED:["Dibatalkan","status-open"]
  };
  return m[status] ?? ["Diproses","status-open"];
}

export default function ReportsPage() {
  const [user,setUser] = useState<User|null>(null);
  const [reports,setReports] = useState<any[]>([]);
  const [loading,setLoading] = useState(true);
  const [confirming,setConfirming] = useState<any>(null);
  const [rating,setRating] = useState(5);
  const [customerNote,setCustomerNote] = useState("");
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState("");

  useEffect(() => {
    const firebaseAuth = auth;
    if (!firebaseAuth) return;

    return onAuthStateChanged(firebaseAuth, (u) => {
      if (u && !u.isAnonymous) setUser(u);
      else window.location.href = "/login";
    });
  }, []);

  useEffect(() => {
    if (!db || !user) return;
    const q = query(collection(db,"reports"), where("customerId","==",user.uid), orderBy("createdAt","desc"));
    return onSnapshot(q, snap => {
      setReports(snap.docs.map(d=>({id:d.id,...d.data()})));
      setLoading(false);
    }, () => setLoading(false));
  }, [user]);

  async function logout() {
    try { if (auth) await signOut(auth); } finally { window.location.href = "/"; }
  }

  async function confirmJob() {
    if (!confirming) return;
    try {
      setBusy(true); setError("");
      await confirmJobByCustomer({ reportId: confirming.id, rating, customerNote });
      setConfirming(null); setCustomerNote("");
    } catch (err:any) { setError(err?.message || "Konfirmasi gagal disimpan."); }
    finally { setBusy(false); }
  }

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
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"end",gap:20,flexWrap:"wrap"}}>
          <div><span className="eyebrow"><RefreshCw size={15}/> Realtime</span><h1 style={{fontSize:"clamp(34px,5vw,52px)",margin:"14px 0 8px"}}>Laporan Saya</h1><p className="muted">Pantau status laporan Anda dari waktu ke waktu.</p></div>
          <Link href="/lapor" className="btn btn-primary">+ Laporan Baru</Link>
        </div>
        {error && <div style={{background:"#fff0f0",color:"#a32626",padding:13,borderRadius:13,marginTop:18}}>{error}</div>}
        {loading ? <div className="card" style={{marginTop:25}}>Memuat laporan...</div> :
          reports.length===0 ? <div className="card" style={{marginTop:25,textAlign:"center",padding:50}}><h3>Belum ada laporan</h3><p className="muted">Saat ada masalah listrik, buat laporan dari tombol di atas.</p></div> :
          <div style={{display:"grid",gap:15,marginTop:25}}>
            {reports.map(r => {
              const [label,cls]=statusLabel(r.status);
              return <article className="card" key={r.id}>
                <div style={{display:"flex",justifyContent:"space-between",gap:15,alignItems:"start",flexWrap:"wrap"}}>
                  <div><b style={{color:"var(--navy)"}}>NYL-{r.id.slice(0,8).toUpperCase()}</b><h3 style={{margin:"8px 0"}}>{r.problemType}</h3></div>
                  <span className={`status-pill ${cls}`}>{label}</span>
                </div>
                <p className="muted">{r.description}</p>
                {r.location && <p className="muted" style={{fontSize:13}}><MapPin size={15} style={{verticalAlign:"middle",marginRight:5}}/>{r.location.address || `${Number(r.location.latitude).toFixed(5)}, ${Number(r.location.longitude).toFixed(5)}`}</p>}
                <div className="timeline">
                  {[
                    ["Laporan dibuat",true],
                    ["Mencari teknisi",["SEARCHING_ENGINEER","ENGINEER_ASSIGNED","ENGINEER_ON_WAY","ARRIVED","IN_PROGRESS","COMPLETED"].includes(r.status)],
                    ["Teknisi menuju lokasi",["ENGINEER_ON_WAY","ARRIVED","IN_PROGRESS","COMPLETED"].includes(r.status)],
                    ["Teknisi tiba",["ARRIVED","IN_PROGRESS","COMPLETED"].includes(r.status)],
                    ["Pengerjaan",["IN_PROGRESS","COMPLETED"].includes(r.status)],
                    ["Selesai",r.status==="COMPLETED"]
                  ].map(([t,a])=><div className="timeline-item" key={String(t)}><span className={`dot ${a?"active":""}`}/><span>{String(t)}</span></div>)}
                </div>
                {r.technicianId && <div className="technician-summary"><div className="tech-avatar"><UserRound size={18}/></div><div style={{flex:1}}><b>{r.technicianName || "Teknisi NyalaLagi"}</b><div className="muted" style={{fontSize:13}}>Teknisi ditugaskan untuk laporan ini{r.technicianPhone ? ` • ${r.technicianPhone}` : ""}</div></div>{r.technicianPhone && <a className="btn btn-secondary" href={`tel:${r.technicianPhone}`}>Hubungi</a>}</div>}
                {(r.beforePhotoUrls?.length > 0 || r.afterPhotoUrls?.length > 0) && <div className="job-evidence"><b>Dokumentasi pekerjaan</b><div className="job-evidence-grid">{(r.beforePhotoUrls || []).map((u:string)=><img key={u} src={u} alt="Foto sebelum perbaikan" loading="lazy"/>)}{(r.afterPhotoUrls || []).map((u:string)=><img key={u} src={u} alt="Foto sesudah perbaikan" loading="lazy"/>)}</div></div>}
                {r.status === "COMPLETED" && !r.customerConfirmed && <div className="confirm-box"><div><b>Apakah pekerjaan sudah selesai dengan baik?</b><p className="muted" style={{fontSize:13,margin:"5px 0 0"}}>Konfirmasi penerimaan pekerjaan dan beri rating teknisi.</p></div><button className="btn btn-primary" onClick={()=>{setConfirming(r);setRating(5);setCustomerNote("")}}><CheckCircle2 size={16}/> Konfirmasi selesai</button></div>}
                {r.customerConfirmed && <div className="confirmed-box"><CheckCircle2 size={17}/><div><b>Pekerjaan sudah dikonfirmasi</b><div className="muted" style={{fontSize:12}}>Rating Anda: {r.customerRating || "-"}/5</div></div></div>}
                {r.status === "ENGINEER_ON_WAY" && r.technicianId && <LiveTechnicianMap reportId={r.id} customerId={user?.uid || ""} destination={r.location ? { latitude: Number(r.location.latitude), longitude: Number(r.location.longitude) } : undefined} />}
                {r.status === "ENGINEER_ON_WAY" && r.technicianId && <p className="muted" style={{fontSize:12,marginTop:10}}><Navigation size={13} style={{verticalAlign:"middle",marginRight:5}}/> Pelacakan hanya aktif saat teknisi dalam perjalanan dan berhenti otomatis setelah teknisi tiba.</p>}
              </article>
            })}
          </div>
        }
      {confirming && <div className="job-modal-backdrop" onClick={()=>!busy && setConfirming(null)}><div className="job-modal customer-confirm" onClick={e=>e.stopPropagation()}><span className="eyebrow"><Star size={15}/> Konfirmasi layanan</span><h2 style={{margin:"12px 0 6px"}}>Nilai pekerjaan teknisi</h2><p className="muted">Pilih rating 1–5 dan tambahkan catatan jika diperlukan.</p><div className="rating-row">{[1,2,3,4,5].map(n=><button key={n} className={n<=rating?"selected":""} onClick={()=>setRating(n)}><Star size={25} fill="currentColor"/></button>)}</div><div className="field"><label>Catatan pelanggan</label><textarea className="textarea" value={customerNote} onChange={e=>setCustomerNote(e.target.value)} placeholder="Contoh: Teknisi cepat dan hasil perbaikan baik."/></div><div style={{display:"flex",gap:10,justifyContent:"flex-end"}}><button className="btn btn-secondary" disabled={busy} onClick={()=>setConfirming(null)}>Batal</button><button className="btn btn-primary" disabled={busy} onClick={confirmJob}>{busy?"Menyimpan...":"Konfirmasi & kirim rating"}</button></div></div></div>}
      </main>
    </div>
  );
}
