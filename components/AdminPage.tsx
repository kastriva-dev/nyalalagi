"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { Activity, BarChart3, ChevronDown, CircleDollarSign, ClipboardList, LogOut, Menu, Search, ShieldCheck, UserRound, Users, X, MapPin, Pencil } from "lucide-react";
import { auth, db } from "@/lib/firebase";
import { getUserProfile } from "@/lib/user";

type Profile = Record<string, any>;

function money(value: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value || 0);
}

function formatLocation(user: Profile) {
  return [user.subdistrict, user.city, user.province].filter(Boolean).join(", ") || "—";
}

export default function AdminPage() {
  const [me, setMe] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);
  const [users, setUsers] = useState<Profile[]>([]);
  const [reports, setReports] = useState<Profile[]>([]);
  const [search, setSearch] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [active, setActive] = useState("dashboard");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!auth) { setError("Firebase belum dikonfigurasi."); setChecking(false); return; }
    return onAuthStateChanged(auth, async (user) => {
      if (!user || user.isAnonymous) { window.location.href = "/login"; return; }
      try {
        const profile = await getUserProfile(user.uid);
        if (profile?.role !== "admin") { window.location.href = "/laporan"; return; }
        setMe(user); setChecking(false);
      } catch {
        setError("Profil admin tidak dapat diverifikasi."); setChecking(false);
      }
    });
  }, []);

  useEffect(() => {
    if (!db || !me) return;
    const unsubUsers = onSnapshot(collection(db, "users"), snap => {
      setUsers(snap.docs.map(d => ({ id:d.id, ...d.data() })));
    }, err => setError(err.message));
    const unsubReports = onSnapshot(collection(db, "reports"), snap => {
      setReports(snap.docs.map(d => ({ id:d.id, ...d.data() })));
    }, err => setError(err.message));
    return () => { unsubUsers(); unsubReports(); };
  }, [me]);

  const customers = useMemo(() => users.filter(u => (u.role || "customer") === "customer"), [users]);
  const technicians = useMemo(() => users.filter(u => u.role === "technician"), [users]);
  const filteredCustomers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(u => [u.name,u.email,u.phone_number,u.city,u.province,u.subdistrict].some(v => String(v || "").toLowerCase().includes(q)));
  }, [customers, search]);
  const stats = {
    customers: customers.length,
    technicians: technicians.length,
    reports: reports.length,
    openReports: reports.filter(r => !["COMPLETED","CANCELLED"].includes(r.status)).length,
    active: customers.filter(u => u.status === "active").length,
    balance: customers.reduce((sum,u) => sum + Number(u.balance || 0), 0)
  };

  async function logout() {
    if (auth) await signOut(auth);
    window.location.href = "/";
  }

  if (checking) return <div className="admin-loading"><div className="admin-loader"/><b>Memverifikasi akses admin...</b></div>;

  return <div className="admin-shell">
    <aside className={`admin-sidebar ${mobileOpen ? "open" : ""}`}>
      <div className="admin-logo"><Image src="/company/logo.png" alt="NyalaLagi" width={38} height={38}/><div><b>NyalaLagi</b><span>Admin Console</span></div></div>
      <div className="admin-user"><div className="admin-avatar"><ShieldCheck size={19}/></div><div><b>{me?.email || "Administrator"}</b><span>Administrator</span></div></div>
      <nav className="admin-menu">
        <button className={active === "dashboard" ? "active" : ""} onClick={()=>{setActive("dashboard");setMobileOpen(false)}}><BarChart3 size={18}/> Dashboard</button>
        <button className={active === "customers" ? "active" : ""} onClick={()=>{setActive("customers");setMobileOpen(false)}}><Users size={18}/> Data Customer <span>{customers.length}</span></button>
        <button className={active === "reports" ? "active" : ""} onClick={()=>{setActive("reports");setMobileOpen(false)}}><ClipboardList size={18}/> Laporan <span>{reports.length}</span></button>
        <Link href="/?adminEdit=1" className="admin-cms-link" onClick={()=>setMobileOpen(false)}><Pencil size={18}/> Edit Website <span>CMS</span></Link>
      </nav>
      <div className="admin-sidebar-bottom"><Link href="/" onClick={()=>setMobileOpen(false)}><MapPin size={17}/> Lihat Landing Page</Link><button onClick={logout}><LogOut size={17}/> Keluar</button></div>
    </aside>
    {mobileOpen && <button className="admin-overlay" aria-label="Tutup menu" onClick={()=>setMobileOpen(false)}/>}
    <main className="admin-main">
      <header className="admin-topbar"><button className="admin-menu-toggle" onClick={()=>setMobileOpen(true)}><Menu size={22}/></button><div><span className="admin-kicker">ADMINISTRATOR</span><h1>{active === "dashboard" ? "Dashboard" : active === "customers" ? "Data Customer" : "Data Laporan"}</h1></div><div className="admin-top-actions"><span className="admin-status"><i/> Sistem aktif</span><button className="admin-logout" onClick={logout}><LogOut size={16}/> Keluar</button></div></header>
      {error && <div className="admin-error">{error}</div>}

      {active === "dashboard" && <>
        <section className="admin-welcome"><div><span className="eyebrow"><ShieldCheck size={15}/> Admin overview</span><h2>Ringkasan NyalaLagi</h2><p>Monitor data pelanggan, teknisi dan laporan secara keseluruhan dari satu dashboard.</p></div><div className="admin-date"><Activity size={18}/><span>Realtime</span></div></section>
        <section className="admin-stat-grid">
          <article className="admin-stat cyan"><div className="admin-stat-icon"><Users size={21}/></div><div><strong>{stats.customers}</strong><span>Total Customer</span></div></article>
          <article className="admin-stat green"><div className="admin-stat-icon"><UserRound size={21}/></div><div><strong>{stats.technicians}</strong><span>Total Teknisi</span></div></article>
          <article className="admin-stat yellow"><div className="admin-stat-icon"><ClipboardList size={21}/></div><div><strong>{stats.reports}</strong><span>Total Laporan</span></div></article>
          <article className="admin-stat purple"><div className="admin-stat-icon"><Activity size={21}/></div><div><strong>{stats.openReports}</strong><span>Laporan Berjalan</span></div></article>
        </section>
        <section className="admin-summary-grid"><div className="admin-panel"><div className="admin-panel-head"><div><span>Customer aktif</span><strong>{stats.active} <small>/ {stats.customers}</small></strong></div><Users size={22}/></div><div className="progress"><i style={{width:`${stats.customers ? Math.round(stats.active/stats.customers*100) : 0}%`}}/></div><p>Persentase customer dengan status active.</p></div><div className="admin-panel"><div className="admin-panel-head"><div><span>Total saldo customer</span><strong>{money(stats.balance)}</strong></div><CircleDollarSign size={22}/></div><p>Akumulasi field <b>balance</b> pada data customer.</p></div><div className="admin-panel"><div className="admin-panel-head"><div><span>Laporan selesai</span><strong>{reports.filter(r=>r.status === "COMPLETED").length}</strong></div><ClipboardList size={22}/></div><p>Laporan dengan status COMPLETED.</p></div></section>
        <section className="admin-panel admin-recent"><div className="admin-panel-title"><div><span>Customer terbaru di sistem</span><h3>{customers.length} customer terdaftar</h3></div><button onClick={()=>setActive("customers")}>Lihat semua <ChevronDown size={16}/></button></div><div className="mini-table">{customers.slice(-5).reverse().map(u=><div className="mini-row" key={u.id}><div className="mini-avatar">{u.profilce_picture ? <img src={u.profilce_picture} alt=""/> : <UserRound size={16}/>}</div><div className="mini-main"><b>{u.name || "Tanpa nama"}</b><span>{u.email || "—"}</span></div><span className={`admin-badge ${u.status === "active" ? "success" : "muted-badge"}`}>{u.status || "—"}</span></div>)}{customers.length === 0 && <div className="empty-admin">Belum ada customer.</div>}</div></section>
      </>}

      {active === "customers" && <section className="admin-panel admin-data-panel"><div className="admin-panel-title"><div><span>Users collection</span><h3>Data pendaftaran customer</h3></div><div className="admin-search"><Search size={17}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Cari nama, email, nomor, kota..."/></div></div><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Customer</th><th>Nomor WhatsApp</th><th>Alamat</th><th>Wilayah</th><th>Saldo</th><th>Status</th><th>Role</th></tr></thead><tbody>{filteredCustomers.map(u=><tr key={u.id}><td><div className="table-person"><div className="mini-avatar">{u.profilce_picture ? <img src={u.profilce_picture} alt=""/> : <UserRound size={16}/>}</div><div><b>{u.name || "Tanpa nama"}</b><small>{u.email || "—"}</small></div></div></td><td>{u.phone_number || "—"}</td><td className="address-cell">{u.address || "—"}</td><td>{formatLocation(u)}</td><td>{money(Number(u.balance || 0))}</td><td><span className={`admin-badge ${u.status === "active" ? "success" : "muted-badge"}`}>{u.status || "—"}</span></td><td><span className="role-badge">{u.role || "customer"}</span></td></tr>)}</tbody></table>{filteredCustomers.length === 0 && <div className="empty-admin">Data customer tidak ditemukan.</div>}</div></section>}

      {active === "reports" && <section className="admin-panel admin-data-panel"><div className="admin-panel-title"><div><span>Reports collection</span><h3>Semua laporan customer</h3></div><div className="admin-report-count"><ClipboardList size={17}/> {reports.length} laporan</div></div><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Nomor</th><th>Customer</th><th>Masalah</th><th>Status</th><th>Lokasi</th></tr></thead><tbody>{reports.map(r=><tr key={r.id}><td><b>NYL-{String(r.id).slice(0,8).toUpperCase()}</b></td><td>{r.customerName || "—"}<small className="table-sub">{r.customerPhone || "—"}</small></td><td>{r.problemType || "—"}</td><td><span className="role-badge">{r.status || "—"}</span></td><td>{r.location?.address || (r.location ? `${Number(r.location.latitude).toFixed(5)}, ${Number(r.location.longitude).toFixed(5)}` : "—")}</td></tr>)}</tbody></table>{reports.length === 0 && <div className="empty-admin">Belum ada laporan.</div>}</div></section>}
    </main>
  </div>;
}
