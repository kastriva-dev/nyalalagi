"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  Activity, BarChart3, ChevronLeft, ChevronRight, CircleDollarSign, ClipboardList,
  LogOut, Menu, Search, ShieldCheck, UserRound, Users, X, MapPin, Pencil,
  UserCog, UserPlus, Wrench, CheckCircle2, Clock3, Navigation, Loader2, RefreshCw
} from "lucide-react";
import {
  collection, doc, getCountFromServer, getDocs, limit, orderBy, query, startAfter,
  updateDoc, serverTimestamp, where, type QueryDocumentSnapshot, type DocumentData
} from "firebase/firestore";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { getUserProfile } from "@/lib/user";

type Profile = Record<string, any> & { id: string };
const PAGE_SIZE = 20;
const STATUS_META: Record<string, { label: string; icon: any; cls: string }> = {
  SEARCHING_ENGINEER: { label: "Mencari teknisi", icon: Search, cls: "searching" },
  ENGINEER_ASSIGNED: { label: "Teknisi ditugaskan", icon: UserCog, cls: "assigned" },
  ENGINEER_ON_WAY: { label: "Menuju lokasi", icon: Navigation, cls: "onway" },
  ARRIVED: { label: "Teknisi tiba", icon: MapPin, cls: "arrived" },
  IN_PROGRESS: { label: "Pengerjaan", icon: Wrench, cls: "progressing" },
  COMPLETED: { label: "Selesai", icon: CheckCircle2, cls: "completed" },
  REJECTED: { label: "Ditolak", icon: X, cls: "rejected" },
  CANCELLED: { label: "Dibatalkan", icon: X, cls: "cancelled" }
};

function money(value: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value || 0);
}
function formatLocation(user: Profile) {
  return [user.subdistrict, user.city, user.province].filter(Boolean).join(", ") || "—";
}
function toDate(value: any) {
  if (!value) return null;
  if (typeof value?.toDate === "function") return value.toDate();
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}
function dateText(value: any) {
  const d = toDate(value); return d ? d.toLocaleString("id-ID", { dateStyle: "short", timeStyle: "short" }) : "—";
}

export default function AdminPage() {
  const [me, setMe] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);
  const [active, setActive] = useState("dashboard");
  const [error, setError] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);

  const [stats, setStats] = useState({ customers: 0, technicians: 0, reports: 0, completed: 0, open: 0 });
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [weekly, setWeekly] = useState<number[]>(Array(7).fill(0));
  const [recentCustomers, setRecentCustomers] = useState<Profile[]>([]);
  const [dashboardLoading, setDashboardLoading] = useState(false);

  const [rows, setRows] = useState<Profile[]>([]);
  const [pageLoading, setPageLoading] = useState(false);
  const [nextCursor, setNextCursor] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [pageHistory, setPageHistory] = useState<QueryDocumentSnapshot<DocumentData>[]>([]);
  const [search, setSearch] = useState("");
  const [searchApplied, setSearchApplied] = useState("");
  const [assigning, setAssigning] = useState("");
  const [updatingRole, setUpdatingRole] = useState("");
  const [balanceTotal, setBalanceTotal] = useState(0);

  useEffect(() => {
    if (!auth) { setError("Firebase belum dikonfigurasi."); setChecking(false); return; }
    return onAuthStateChanged(auth, async user => {
      if (!user || user.isAnonymous) { window.location.href = "/login"; return; }
      try {
        const profile = await getUserProfile(user.uid);
        if (profile?.role !== "admin") { window.location.href = "/laporan"; return; }
        setMe(user); setChecking(false);
      } catch { setError("Profil admin tidak dapat diverifikasi."); setChecking(false); }
    });
  }, []);

  const count = useCallback(async (col: string, ...constraints: any[]) => {
    if (!db) return 0;
    const q = query(collection(db, col), ...constraints);
    const snap = await getCountFromServer(q);
    return snap.data().count;
  }, []);

  const loadDashboard = useCallback(async () => {
    if (!db || !me) return;
    setDashboardLoading(true); setError("");
    try {
      const sevenAgo = new Date(); sevenAgo.setHours(0, 0, 0, 0); sevenAgo.setDate(sevenAgo.getDate() - 6);
      const [customers, technicians, reports, completed, searching, assigned, onway, arrived, inprogress, recentSnap] = await Promise.all([
        count("users", where("role", "==", "customer")),
        count("users", where("role", "==", "technician")),
        count("reports"),
        count("reports", where("status", "==", "COMPLETED")),
        count("reports", where("status", "==", "SEARCHING_ENGINEER")),
        count("reports", where("status", "==", "ENGINEER_ASSIGNED")),
        count("reports", where("status", "==", "ENGINEER_ON_WAY")),
        count("reports", where("status", "==", "ARRIVED")),
        count("reports", where("status", "==", "IN_PROGRESS")),
        getDocs(query(collection(db, "users"), orderBy("createdAt", "desc"), limit(20)))
      ]);
      setStats({ customers, technicians, reports, completed, open: Math.max(0, reports - completed) });
      setStatusCounts({ SEARCHING_ENGINEER: searching, ENGINEER_ASSIGNED: assigned, ENGINEER_ON_WAY: onway, ARRIVED: arrived, IN_PROGRESS: inprogress, COMPLETED: completed });
      setRecentCustomers(recentSnap.docs.map(d => ({ id: d.id, ...d.data() } as Profile)).filter(u => (u.role || "customer") === "customer").slice(0,5));

      const weekQ = query(collection(db, "reports"), where("createdAt", ">=", sevenAgo), orderBy("createdAt", "asc"));
      const weekSnap = await getDocs(weekQ);
      const buckets = Array(7).fill(0);
      weekSnap.docs.forEach(d => { const dt = toDate(d.data().createdAt); if (!dt) return; const idx = Math.floor((new Date(dt.getFullYear(), dt.getMonth(), dt.getDate()).getTime() - sevenAgo.getTime()) / 86400000); if (idx >= 0 && idx < 7) buckets[idx]++; });
      setWeekly(buckets);

      // Optional finance card: aggregation is not available for arbitrary sum, so only read a bounded recent sample.
      // The card is intentionally not used as a core operational metric.
      setBalanceTotal(0);
    } catch (e: any) { setError(e?.message || "Gagal memuat dashboard."); }
    finally { setDashboardLoading(false); }
  }, [count, me]);

  useEffect(() => { if (me && active === "dashboard") loadDashboard(); }, [me, active, loadDashboard]);

  const loadPage = useCallback(async (kind: "customers" | "reports" | "technicians", cursor: QueryDocumentSnapshot<DocumentData> | null = null, direction: "next" | "reset" = "reset", searchTerm = searchApplied) => {
    if (!db || !me) return;
    setPageLoading(true); setError("");
    try {
      const constraints: any[] = [];
      if (kind === "customers") constraints.push(where("role", "==", "customer"));
      if (kind === "technicians") constraints.push(where("role", "==", "technician"));
      if (searchTerm) {
        // Email prefix search is server-side. We intentionally do not combine it with
        // role/orderBy constraints, avoiding a large composite-index requirement.
        constraints.push(where("email", ">=", searchTerm), where("email", "<=", searchTerm + "\uf8ff"));
      }
      const finalConstraints = searchTerm
        ? [...constraints, ...(cursor ? [startAfter(cursor)] : []), limit(PAGE_SIZE)]
        : [...constraints, orderBy("createdAt", "desc"), ...(cursor ? [startAfter(cursor)] : []), limit(PAGE_SIZE)];
      const snap = await getDocs(query(collection(db, kind === "reports" ? "reports" : "users"), ...finalConstraints));
      const mapped = snap.docs.map(d => ({ id: d.id, ...d.data() } as Profile)).filter(r => kind === "customers" ? (r.role || "customer") === "customer" : kind === "technicians" ? r.role === "technician" : true);
      setRows(mapped);
      setNextCursor(snap.docs.length === PAGE_SIZE ? snap.docs[snap.docs.length - 1] : null);
      if (direction === "reset") setPageHistory([]);
    } catch (e: any) { setError(e?.message || "Gagal memuat data. Jika Firestore meminta index, ikuti link index pada pesan error."); }
    finally { setPageLoading(false); }
  }, [me, searchApplied]);

  useEffect(() => {
    if (!me || active === "dashboard") return;
    setRows([]); setNextCursor(null); setPageHistory([]); setSearchApplied(""); setSearch("");
    loadPage(active as any, null, "reset", "");
  }, [me, active]); // eslint-disable-line react-hooks/exhaustive-deps

  async function goNext() {
    if (!nextCursor) return;
    setPageHistory(h => [...h, nextCursor]);
    await loadPage(active as any, nextCursor, "next");
  }
  async function goPrev() {
    if (!pageHistory.length) return;
    const history = [...pageHistory];
    history.pop();
    const cursor = history.length ? history[history.length - 1] : null;
    setPageHistory(history);
    await loadPage(active as any, cursor, "next");
  }
  async function runSearch() {
    setSearchApplied(search.trim().toLowerCase());
    setPageHistory([]); setNextCursor(null);
    await loadPage(active as any, null, "reset", search.trim().toLowerCase());
  }

  // Assignment selector needs technician records but never loads the whole collection: fetch a bounded list when reports view opens.
  const [assignmentTechs, setAssignmentTechs] = useState<Profile[]>([]);
  useEffect(() => {
    if (!db || !me || active !== "reports") return;
    getDocs(query(collection(db, "users"), where("role", "==", "technician"), limit(100)))
      .then((snapshot) => {
        const technicians = snapshot.docs
          .map((docSnapshot) => ({
            id: docSnapshot.id,
            ...docSnapshot.data(),
          }) as Profile)
          .filter((technician) => technician.status === "active")
          .sort((a, b) => {
            const nameA = String(a.name || a.email || "");
            const nameB = String(b.name || b.email || "");
            return nameA.localeCompare(nameB);
          });

        setAssignmentTechs(technicians);
      })
      .catch((e) => setError(e?.message || "Gagal memuat daftar teknisi."));
  }, [active, me]);

  async function assign(report: Profile, technicianId: string) {
    if (!db || !technicianId) return;
    const technician = assignmentTechs.find(t => t.id === technicianId); if (!technician) return;
    try {
      setAssigning(report.id);
      await updateDoc(doc(db, "reports", report.id), { technicianId, technicianName: technician.name || "Teknisi", technicianPhone: technician.phone_number || "", status: "ENGINEER_ASSIGNED", assignedAt: serverTimestamp(), updatedAt: serverTimestamp() });
      setRows(rs => rs.map(r => r.id === report.id ? { ...r, technicianId, technicianName: technician.name, technicianPhone: technician.phone_number, status: "ENGINEER_ASSIGNED" } : r));
    } catch (e: any) { setError(e?.message || "Gagal menugaskan teknisi."); }
    finally { setAssigning(""); }
  }
  async function promoteToTechnician(user: Profile) {
    if (!db || !user.id || !window.confirm(`Jadikan ${user.name || user.email || "user ini"} sebagai teknisi?`)) return;
    try { setUpdatingRole(user.id); await updateDoc(doc(db, "users", user.id), { role: "technician", status: "active", updatedAt: serverTimestamp() }); setRows(rs => rs.filter(r => r.id !== user.id)); }
    catch (e: any) { setError(e?.message || "Gagal mengubah role."); } finally { setUpdatingRole(""); }
  }
  async function logout() { if (auth) await signOut(auth); window.location.href = "/"; }

  if (checking) return <div className="admin-loading"><div className="admin-loader"/><b>Memverifikasi akses admin...</b></div>;

  const maxWeek = Math.max(1, ...weekly);
  const weekLabels = weekly.map((_, i) => { const d = new Date(); d.setHours(0,0,0,0); d.setDate(d.getDate() - (6-i)); return d.toLocaleDateString("id-ID", { weekday: "short" }); });

  return <div className="admin-shell">
    <aside className={`admin-sidebar ${mobileOpen ? "open" : ""}`}>
      <div className="admin-logo"><Image src="/company/logo.png" alt="NyalaLagi" width={38} height={38}/><div><b>NyalaLagi</b><span>Operational Console</span></div></div>
      <div className="admin-user"><div className="admin-avatar"><ShieldCheck size={19}/></div><div><b>{me?.email || "Administrator"}</b><span>Administrator</span></div></div>
      <nav className="admin-menu">
        <button className={active === "dashboard" ? "active" : ""} onClick={()=>{setActive("dashboard");setMobileOpen(false)}}><BarChart3 size={18}/> Dashboard</button>
        <button className={active === "customers" ? "active" : ""} onClick={()=>{setActive("customers");setMobileOpen(false)}}><Users size={18}/> Customer</button>
        <button className={active === "reports" ? "active" : ""} onClick={()=>{setActive("reports");setMobileOpen(false)}}><ClipboardList size={18}/> Laporan</button>
        <button className={active === "technicians" ? "active" : ""} onClick={()=>{setActive("technicians");setMobileOpen(false)}}><UserCog size={18}/> Teknisi</button>
        <Link href="/?adminEdit=1" className="admin-cms-link" onClick={()=>setMobileOpen(false)}><Pencil size={18}/> Edit Website <span>CMS</span></Link>
      </nav>
      <div className="admin-sidebar-bottom"><Link href="/" onClick={()=>setMobileOpen(false)}><MapPin size={17}/> Lihat Landing Page</Link><button onClick={logout}><LogOut size={17}/> Keluar</button></div>
    </aside>
    {mobileOpen && <button className="admin-overlay" aria-label="Tutup menu" onClick={()=>setMobileOpen(false)}/>} 
    <main className="admin-main">
      <header className="admin-topbar"><button className="admin-menu-toggle" onClick={()=>setMobileOpen(true)}><Menu size={22}/></button><div><span className="admin-kicker">ADMINISTRATOR</span><h1>{active === "dashboard" ? "Dashboard Operasional" : active === "customers" ? "Data Customer" : active === "reports" ? "Data Laporan" : "Manajemen Teknisi"}</h1></div><div className="admin-top-actions"><span className="admin-status"><i/> Sistem aktif</span><button className="admin-logout" onClick={logout}><LogOut size={16}/> Keluar</button></div></header>
      {error && <div className="admin-error">{error}<button onClick={()=>setError("")}><X size={14}/></button></div>}

      {active === "dashboard" && <>
        <section className="admin-welcome"><div><span className="eyebrow"><ShieldCheck size={15}/> Operational overview</span><h2>Monitor NyalaLagi secara real-time</h2><p>Statistik memakai Firestore aggregation query. Data tabel dimuat bertahap dengan pagination agar tidak mengambil seluruh collection.</p></div><button className="admin-refresh" onClick={loadDashboard} disabled={dashboardLoading}>{dashboardLoading ? <Loader2 size={16} className="spin"/> : <RefreshCw size={16}/>} Refresh</button></section>
        <section className="admin-stat-grid">
          <article className="admin-stat cyan"><div className="admin-stat-icon"><Users size={21}/></div><div><strong>{stats.customers.toLocaleString("id-ID")}</strong><span>Customer</span></div></article>
          <article className="admin-stat green"><div className="admin-stat-icon"><UserRound size={21}/></div><div><strong>{stats.technicians.toLocaleString("id-ID")}</strong><span>Teknisi</span></div></article>
          <article className="admin-stat yellow"><div className="admin-stat-icon"><ClipboardList size={21}/></div><div><strong>{stats.reports.toLocaleString("id-ID")}</strong><span>Laporan</span></div></article>
          <article className="admin-stat purple"><div className="admin-stat-icon"><CheckCircle2 size={21}/></div><div><strong>{stats.completed.toLocaleString("id-ID")}</strong><span>Selesai</span></div></article>
        </section>
        <section className="admin-dashboard-grid">
          <div className="admin-panel chart-panel"><div className="admin-panel-title"><div><span>Aktivitas masuk</span><h3>Laporan 7 Hari Terakhir</h3></div><span className="chart-total">{weekly.reduce((a,b)=>a+b,0)} laporan</span></div><div className="bar-chart">{weekly.map((n,i)=><div className="bar-col" key={i}><span>{n}</span><div className="bar-track"><i style={{height:`${Math.max(4, n/maxWeek*100)}%`}}/></div><small>{weekLabels[i]}</small></div>)}</div></div>
          <div className="admin-panel status-panel"><div className="admin-panel-title"><div><span>Live workload</span><h3>Status Laporan</h3></div><Activity size={20}/></div>{["SEARCHING_ENGINEER","ENGINEER_ASSIGNED","ENGINEER_ON_WAY","IN_PROGRESS","COMPLETED"].map(s=>{const m=STATUS_META[s]; const Icon=m.icon; return <div className="status-line" key={s}><span className={`status-dot ${m.cls}`}><Icon size={14}/></span><b>{m.label}</b><strong>{(statusCounts[s]||0).toLocaleString("id-ID")}</strong></div>})}</div>
        </section>
        <section className="admin-summary-grid"><div className="admin-panel"><div className="admin-panel-head"><div><span>Laporan berjalan</span><strong>{stats.open.toLocaleString("id-ID")}</strong></div><Clock3 size={22}/></div><p>Semua laporan yang belum COMPLETED.</p></div><div className="admin-panel"><div className="admin-panel-head"><div><span>Completion rate</span><strong>{stats.reports ? Math.round(stats.completed/stats.reports*100) : 0}%</strong></div><CheckCircle2 size={22}/></div><p>Persentase laporan yang sudah selesai.</p></div><div className="admin-panel"><div className="admin-panel-head"><div><span>Teknisi aktif</span><strong>{stats.technicians.toLocaleString("id-ID")}</strong></div><Wrench size={22}/></div><p>Total akun dengan role technician.</p></div></section>
        <section className="admin-panel admin-recent"><div className="admin-panel-title"><div><span>Customer terbaru</span><h3>5 pendaftar terakhir</h3></div><button onClick={()=>setActive("customers")}>Lihat data <ChevronRight size={16}/></button></div><div className="mini-table">{recentCustomers.map(u=><div className="mini-row" key={u.id}><div className="mini-avatar">{u.profilce_picture ? <img src={u.profilce_picture} alt=""/> : <UserRound size={16}/>}</div><div className="mini-main"><b>{u.name || "Tanpa nama"}</b><span>{u.email || "—"}</span></div><span className="admin-badge success">{u.status || "active"}</span></div>)}{!recentCustomers.length && <div className="empty-admin">Belum ada customer.</div>}</div></section>
      </>}

      {active !== "dashboard" && <section className="admin-panel admin-data-panel">
        <div className="admin-panel-title"><div><span>{active === "customers" ? "Users / role=customer" : active === "technicians" ? "Users / role=technician" : "Reports collection"}</span><h3>{active === "customers" ? "Data pendaftaran customer" : active === "technicians" ? "Teknisi terdaftar" : "Assignment & laporan customer"}</h3></div>
          <div className="admin-data-actions">{(active === "customers" || active === "technicians") && <div className="admin-search"><Search size={17}/><input value={search} onChange={e=>setSearch(e.target.value)} onKeyDown={e=>e.key === "Enter" && runSearch()} placeholder="Cari berdasarkan email..."/><button onClick={runSearch}>Cari</button></div>}<span className="admin-report-count">{pageLoading ? <Loader2 size={15} className="spin"/> : `${rows.length} data halaman`}</span></div>
        </div>
        <div className="admin-table-wrap"><table className="admin-table"><thead>{active === "customers" ? <tr><th>Customer</th><th>WhatsApp</th><th>Alamat</th><th>Wilayah</th><th>Status</th><th>Role</th></tr> : active === "technicians" ? <tr><th>Teknisi</th><th>WhatsApp</th><th>Wilayah</th><th>Rating</th><th>Status</th></tr> : <tr><th>Nomor</th><th>Customer</th><th>Masalah</th><th>Status</th><th>Teknisi</th><th>Lokasi</th><th>Dibuat</th></tr>}</thead><tbody>
          {active === "customers" && rows.map(u=><tr key={u.id}><td><div className="table-person"><div className="mini-avatar">{u.profilce_picture ? <img src={u.profilce_picture} alt=""/> : <UserRound size={16}/>}</div><div><b>{u.name || "Tanpa nama"}</b><small>{u.email || "—"}</small></div></div></td><td>{u.phone_number || "—"}</td><td className="address-cell">{u.address || "—"}</td><td>{formatLocation(u)}</td><td><span className={`admin-badge ${u.status === "active" ? "success" : "muted-badge"}`}>{u.status || "—"}</span></td><td><span className="role-badge">{u.role || "customer"}</span></td></tr>)}
          {active === "technicians" && rows.map(t=><tr key={t.id}><td><div className="table-person"><div className="mini-avatar"><UserCog size={16}/></div><div><b>{t.name || "Tanpa nama"}</b><small>{t.email || "—"}</small></div></div></td><td>{t.phone_number || "—"}</td><td>{formatLocation(t)}</td><td><b>★ {Number(t.ratingAverage || 0).toFixed(2)}</b><small className="table-sub">{Number(t.ratingCount || 0)} ulasan</small></td><td><span className={`admin-badge ${t.status === "active" ? "success" : "muted-badge"}`}>{t.status || "—"}</span></td></tr>)}
          {active === "reports" && rows.map(r=>{const m=STATUS_META[r.status] || {label:r.status||"—",icon:Activity,cls:"muted"}; const Icon=m.icon; return <tr key={r.id}><td><b>NYL-{String(r.id).slice(0,8).toUpperCase()}</b></td><td>{r.customerName || "—"}<small className="table-sub">{r.customerPhone || "—"}</small></td><td>{r.problemType || "—"}</td><td><span className={`status-chip ${m.cls}`}><Icon size={12}/>{m.label}</span></td><td>{["COMPLETED","CANCELLED","REJECTED"].includes(r.status) ? (r.technicianName || "—") : <select className="input" value={r.technicianId || ""} disabled={assigning === r.id} onChange={e=>assign(r,e.target.value)} style={{minWidth:180,padding:"8px 10px"}}><option value="">{r.technicianId ? "Teknisi tersimpan" : "Pilih teknisi"}</option>{assignmentTechs.map(t=><option key={t.id} value={t.id}>{t.name || t.email || t.id}</option>)}</select>}{r.technicianName && <small className="table-sub">{r.technicianPhone || ""}</small>}</td><td>{r.location?.address || (r.location ? `${Number(r.location.latitude).toFixed(5)}, ${Number(r.location.longitude).toFixed(5)}` : "—")}</td><td>{dateText(r.createdAt)}</td></tr>})}
        </tbody></table>{!rows.length && <div className="empty-admin">{pageLoading ? "Memuat data..." : searchApplied ? "Tidak ada data dengan email tersebut." : "Tidak ada data pada halaman ini."}</div>}</div>
        <div className="admin-pagination"><button disabled={!pageHistory.length || pageLoading} onClick={goPrev}><ChevronLeft size={16}/> Sebelumnya</button><span>Halaman {pageHistory.length + 1} · Maks. {PAGE_SIZE} data/query</span><button disabled={!nextCursor || pageLoading} onClick={goNext}>Berikutnya <ChevronRight size={16}/></button></div>
        {active === "technicians" && <div className="promote-box"><h4>Promosikan customer menjadi teknisi</h4><p>Untuk menjaga performa, daftar ini hanya mengambil maksimal 20 customer aktif terbaru.</p><button className="btn btn-secondary" onClick={()=>setActive("customers")}><UserPlus size={15}/> Buka data customer</button></div>}
        {active === "customers" && rows.length > 0 && <div className="promote-box"><h4>Aksi teknisi</h4><p>Pilih customer di halaman ini untuk dipromosikan. Perubahan role langsung tersimpan ke Firestore.</p><div className="promote-list">{rows.slice(0,5).filter(c=>c.status === "active").map(c=><div key={c.id}><span><b>{c.name || "Tanpa nama"}</b><small>{c.email || "—"}</small></span><button className="btn btn-secondary" disabled={updatingRole===c.id} onClick={()=>promoteToTechnician(c)}>{updatingRole===c.id ? "Memproses..." : <><UserPlus size={14}/> Jadikan Teknisi</>}</button></div>)}</div></div>}
      </section>}
    </main>
  </div>;
}
