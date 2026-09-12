 "use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Clock3, MapPin, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { onAuthStateChanged, signInAnonymously, User } from "firebase/auth";
import { collection, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

function statusLabel(status:string) {
  const m:any = {
    SEARCHING_ENGINEER:["Mencari teknisi","status-open"],
    ENGINEER_ASSIGNED:["Teknisi ditemukan","status-process"],
    ENGINEER_ON_WAY:["Teknisi menuju lokasi","status-process"],
    IN_PROGRESS:["Dalam pengerjaan","status-process"],
    COMPLETED:["Selesai","status-done"],
    CANCELLED:["Dibatalkan","status-open"]
  };
  return m[status] ?? ["Diproses","status-open"];
}

export default function ReportsPage() {
  const [user,setUser] = useState<User|null>(null);
  const [reports,setReports] = useState<any[]>([]);
  const [loading,setLoading] = useState(true);

  useEffect(() => {
    const firebaseAuth = auth;
    if (!firebaseAuth) return;

    return onAuthStateChanged(firebaseAuth, async u => {
      if (u) {
        setUser(u);
      } else {
        try {
          await signInAnonymously(firebaseAuth);
        } catch (e) {
          console.error(e);
        }
      }
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

  return (
    <div className="page-shell">
      <header className="app-header"><div className="container app-header-inner">
        <Link href="/" className="app-brand"><Image src="/company/logo.png" alt="" width={38} height={38}/> NyalaLagi</Link>
        <Link href="/" className="btn btn-secondary"><ArrowLeft size={16}/> Beranda</Link>
      </div></header>
      <main className="container form-wrap">
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"end",gap:20,flexWrap:"wrap"}}>
          <div><span className="eyebrow"><RefreshCw size={15}/> Realtime</span><h1 style={{fontSize:"clamp(34px,5vw,52px)",margin:"14px 0 8px"}}>Laporan Saya</h1><p className="muted">Pantau status laporan Anda dari waktu ke waktu.</p></div>
          <Link href="/lapor" className="btn btn-primary">+ Laporan Baru</Link>
        </div>
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
                    ["Mencari teknisi",["SEARCHING_ENGINEER","ENGINEER_ASSIGNED","ENGINEER_ON_WAY","IN_PROGRESS","COMPLETED"].includes(r.status)],
                    ["Teknisi menuju lokasi",["ENGINEER_ON_WAY","IN_PROGRESS","COMPLETED"].includes(r.status)],
                    ["Pengerjaan",["IN_PROGRESS","COMPLETED"].includes(r.status)],
                    ["Selesai",r.status==="COMPLETED"]
                  ].map(([t,a])=><div className="timeline-item" key={String(t)}><span className={`dot ${a?"active":""}`}/><span>{String(t)}</span></div>)}
                </div>
              </article>
            })}
          </div>
        }
      </main>
    </div>
  );
}
