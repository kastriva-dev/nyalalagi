"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, limit, orderBy, query, serverTimestamp, setDoc, updateDoc, where, writeBatch } from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
import { getDownloadURL, getStorage, ref } from "firebase/storage";
import { AlertCircle, Check, Loader2, Pencil, Plus, RefreshCw, Search, Trash2, X } from "lucide-react";
import { app, db } from "@/lib/firebase";
import { geographyId, legacyAreaCityPairs, legacyRegionalNames } from "@/lib/legacy-geography";

type Row = Record<string, any> & { id: string };
type Field = { key: string; label: string; type?: "text" | "number" | "textarea" | "checkbox"; required?: boolean };
type ModuleId = "products" | "banks" | "provinces" | "cities" | "subdistricts" | "billing" | "transactions" | "incomes" | "wallets" | "topups" | "reviews";

const definitions: Record<ModuleId, { title: string; subtitle: string; collection?: string; fields?: Field[]; readOnly?: boolean }> = {
  products: { title: "Layanan & Kerusakan", subtitle: "Katalog layanan yang dipakai untuk menerima laporan.", collection: "products", fields: [{ key: "name", label: "Nama layanan", required: true }, { key: "description", label: "Deskripsi", type: "textarea" }, { key: "price", label: "Harga (Rp)", type: "number" }, { key: "people", label: "Jumlah teknisi", type: "number" }, { key: "active", label: "Aktif", type: "checkbox" }] },
  banks: { title: "Rekening Bank", subtitle: "Data rekening pembayaran untuk pengelolaan admin dan integrasi pembayaran.", collection: "banks", fields: [{ key: "name", label: "Nama bank", required: true }, { key: "accountNumber", label: "Nomor rekening", required: true }, { key: "accountName", label: "Nama pemilik rekening", required: true }, { key: "active", label: "Aktif", type: "checkbox" }] },
  provinces: { title: "Regional", subtitle: "Daftar wilayah regional untuk data lokasi.", collection: "provinces", fields: [{ key: "name", label: "Nama regional", required: true }] },
  cities: { title: "Area", subtitle: "Area layanan yang terhubung ke regional.", collection: "cities", fields: [{ key: "name", label: "Nama area", required: true }, { key: "province", label: "Regional", required: true }] },
  subdistricts: { title: "Kota / Kecamatan", subtitle: "Kota atau kecamatan yang terhubung ke area layanan.", collection: "subdistricts", fields: [{ key: "name", label: "Nama kota/kecamatan", required: true }, { key: "city", label: "Area layanan", required: true }, { key: "province", label: "Regional" }] },
  billing: { title: "Tarif Layanan", subtitle: "Konfigurasi persentase dan biaya untuk integrasi perhitungan layanan.", collection: "settings", fields: [{ key: "discountPercent", label: "Diskon (%)", type: "number" }, { key: "serviceFeePercent", label: "Biaya layanan (%)", type: "number" }, { key: "userAdminFee", label: "Biaya admin customer (Rp)", type: "number" }, { key: "technicianLimit", label: "Limit teknisi (Rp)", type: "number" }, { key: "transportFee", label: "Biaya transport (Rp)", type: "number" }] },
  transactions: { title: "Transaksi", subtitle: "Laporan layanan yang tersimpan di Firestore, paling banyak 100 terbaru.", collection: "reports", readOnly: true },
  incomes: { title: "Pendapatan", subtitle: "Ringkasan dari laporan selesai yang memuat nominal. Sampel dibatasi 100 laporan terbaru.", collection: "reports", readOnly: true },
  wallets: { title: "Dompet Teknisi", subtitle: "Saldo pada profil teknisi. Saldo hanya dapat berubah melalui proses server yang tervalidasi.", collection: "users", readOnly: true },
  topups: { title: "Konfirmasi Top-up", subtitle: "Periksa bukti transfer sebelum konfirmasi. Persetujuan diproses aman di server dan dicatat sebagai histori saldo.", collection: "topups" },
  reviews: { title: "Testimoni Customer", subtitle: "Ulasan customer pada laporan selesai. Ulasan tersedia untuk dibaca admin.", collection: "technicianReviews", readOnly: true }
};

const amountOf = (row: Row) => {
  const raw = row.amount ?? row.totalAmount ?? row.total ?? row.nominal ?? row.price ?? row.finalPrice ?? 0;
  const amount = typeof raw === "string" ? Number(raw.replace(/[^0-9.-]/g, "")) : Number(raw);
  return Number.isFinite(amount) ? amount : 0;
};
const rupiah = (value: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value);
const labelStatus = (value: unknown) => String(value || "—").replaceAll("_", " ");
const DEMO_STORAGE = "nyalalagi-admin-demo-v1";

function demoRows(module: ModuleId): Row[] {
  const createdAt = new Date().toISOString();
  const examples: Record<ModuleId, Row[]> = {
    products: [{ id: "demo-service-1", name: "Perbaikan stop kontak", description: "Pemeriksaan dan perbaikan titik stop kontak", price: 75000, people: 1, active: true }, { id: "demo-service-2", name: "Pemasangan MCB", description: "Pemasangan atau penggantian MCB", price: 125000, people: 1, active: true }],
    banks: [{ id: "demo-bank-1", name: "Bank Contoh", accountNumber: "0000000000", accountName: "NyalaLagi Demo", active: true }],
    provinces: [{ id: "demo-province-1", name: "Jawa Barat" }, { id: "demo-province-2", name: "Jawa Tengah" }],
    cities: [{ id: "demo-city-1", name: "Cirebon", province: "Jawa Barat" }, { id: "demo-city-2", name: "Bandung", province: "Jawa Barat" }],
    subdistricts: [{ id: "demo-subdistrict-1", name: "Kesambi", city: "Cirebon", province: "Jawa Barat" }, { id: "demo-subdistrict-2", name: "Kejaksan", city: "Cirebon", province: "Jawa Barat" }],
    billing: [{ id: "billing", discountPercent: 0, serviceFeePercent: 10, userAdminFee: 5000, technicianLimit: 10000, transportFee: 30000 }],
    transactions: [{ id: "demo-report-1", customerName: "Pelanggan Demo", problemType: "Perbaikan stop kontak", status: "COMPLETED", amount: 75000, createdAt }, { id: "demo-report-2", customerName: "Pelanggan Contoh", problemType: "Pemasangan MCB", status: "IN_PROGRESS", amount: 125000, createdAt }],
    incomes: [{ id: "demo-income-1", customerName: "Pelanggan Demo", problemType: "Perbaikan stop kontak", status: "COMPLETED", amount: 75000, completedAt: createdAt }],
    wallets: [{ id: "demo-tech-1", name: "Teknisi Demo 1", email: "teknisi1@example.test", status: "active", balance: 250000 }, { id: "demo-tech-2", name: "Teknisi Demo 2", email: "teknisi2@example.test", status: "active", balance: 125000 }],
    topups: [{ id: "demo-topup-1", technicianId: "demo-tech-1", technicianName: "Teknisi Demo 1", type: "Top-up", bankName: "Bank Contoh", amount: 100000, status: "On Check" }],
    reviews: [{ id: "demo-review-1", reportId: "demo-report-1", customerName: "Pelanggan Demo", technicianId: "demo-tech-1", rating: 5, comment: "Layanan cepat dan ramah", createdAt }]
  };
  return examples[module];
}

export default function AdminModules({ module, onError }: { module: ModuleId; onError: (message: string) => void }) {
  const config = definitions[module];
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Row | null>(null);
  const [draft, setDraft] = useState<Record<string, any>>({});
  const [historyFor, setHistoryFor] = useState<Row | null>(null);
  const [historyRows, setHistoryRows] = useState<Row[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [proofPreview, setProofPreview] = useState("");
  const [demoMode, setDemoMode] = useState(false);
  const [demoReady, setDemoReady] = useState(false);
  const [geoSyncing, setGeoSyncing] = useState(false);
  const [geoConfirmOpen, setGeoConfirmOpen] = useState(false);

  useEffect(() => {
    setDemoMode(window.localStorage.getItem(`${DEMO_STORAGE}:enabled`) === "1");
    setDemoReady(true);
  }, []);

  const load = useCallback(async () => {
    if (!demoReady) return;
    setLoading(true);
    try {
      if (demoMode) {
        const saved = window.localStorage.getItem(`${DEMO_STORAGE}:${module}`);
        setRows(saved ? JSON.parse(saved) : demoRows(module));
      } else if (module === "billing") {
        if (!db) throw new Error("Firebase belum dikonfigurasi.");
        const snap = await getDoc(doc(db, "settings", "billing"));
        setRows(snap.exists() ? [{ id: "billing", ...snap.data() }] : [{ id: "billing" }]);
      } else {
        if (!db) throw new Error("Firebase belum dikonfigurasi.");
        let q;
        if (module === "wallets") q = query(collection(db, "users"), where("role", "==", "technician"), limit(100));
        else if (module === "transactions" || module === "incomes") q = query(collection(db, "reports"), orderBy("createdAt", "desc"), limit(100));
        else q = query(collection(db, config.collection!), limit(100));
        const snap = await getDocs(q);
        let next = snap.docs.map(item => ({ id: item.id, ...item.data() } as Row));
        if (module === "incomes") next = next.filter(r => r.status === "COMPLETED");
        if (module === "topups") next.sort((a, b) => Number(isPending(b.status)) - Number(isPending(a.status)));
        if (module === "products" || module === "banks" || module === "provinces" || module === "cities" || module === "subdistricts") next.sort((a, b) => String(a.name || "").localeCompare(String(b.name || ""), "id"));
        setRows(next);
      }
    } catch (error: any) { onError(error?.message || `Gagal memuat ${config.title.toLowerCase()}.`); }
    finally { setLoading(false); }
  }, [config.collection, config.title, demoMode, demoReady, module, onError]);

  useEffect(() => { setEditing(null); setSearch(""); load(); }, [load]);
  const visibleRows = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter(row => Object.values(row).some(value => String(value ?? "").toLowerCase().includes(term)));
  }, [rows, search]);
  const incomeTotal = rows.reduce((sum, row) => sum + amountOf(row), 0);

  function startCreate() {
    setEditing({ id: "" });
    setDraft(Object.fromEntries((config.fields || []).map(field => [field.key, field.type === "checkbox" ? true : ""])));
  }
  function startEdit(row: Row) { setEditing(row); setDraft(Object.fromEntries((config.fields || []).map(field => [field.key, row[field.key] ?? (field.type === "checkbox" ? false : "")]))); }
  async function save(event: React.FormEvent) {
    event.preventDefault();
    if ((!db && !demoMode) || !config.fields) return;
    for (const field of config.fields) if (field.required && !String(draft[field.key] ?? "").trim()) return onError(`${field.label} wajib diisi.`);
    const data: Record<string, any> = {};
    for (const field of config.fields) {
      const value = draft[field.key];
      data[field.key] = field.type === "number" ? Number(value || 0) : field.type === "checkbox" ? Boolean(value) : String(value ?? "").trim();
    }
    setSaving(true);
    try {
      if (demoMode) {
        const next = editing?.id ? rows.map(row => row.id === editing.id ? { ...row, ...data } : row) : [...rows, { id: `demo-${module}-${Date.now()}`, ...data }];
        window.localStorage.setItem(`${DEMO_STORAGE}:${module}`, JSON.stringify(next));
        setRows(next);
      } else if (module === "billing") await setDoc(doc(db!, "settings", "billing"), { ...data, updatedAt: serverTimestamp() }, { merge: true });
      else if (editing?.id) await updateDoc(doc(db!, config.collection!, editing.id), { ...data, updatedAt: serverTimestamp() });
      else await addDoc(collection(db!, config.collection!), { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
      setEditing(null); await load();
    } catch (error: any) { onError(error?.message || "Data gagal disimpan."); }
    finally { setSaving(false); }
  }
  async function remove(row: Row) {
    if ((!db && !demoMode) || !config.collection || !window.confirm(`Hapus data “${row.name || row.id}”?`)) return;
    try {
      if (demoMode) { const next = rows.filter(item => item.id !== row.id); window.localStorage.setItem(`${DEMO_STORAGE}:${module}`, JSON.stringify(next)); setRows(next); }
      else { await deleteDoc(doc(db!, config.collection, row.id)); await load(); }
    }
    catch (error: any) { onError(error?.message || "Data gagal dihapus."); }
  }
  async function reviewTopup(row: Row, decision: "approve" | "reject") {
    const amount = amountOf(row);
    const technician = row.technicianName || row.userName || row.technicianId || row.userId || "teknisi";
    const prompt = decision === "approve"
      ? `Konfirmasi transfer ${rupiah(amount)} untuk ${technician}? Saldo teknisi akan bertambah satu kali dan tercatat di histori.`
      : `Tolak pengajuan top-up ${rupiah(amount)} untuk ${technician}?`;
    if (!window.confirm(prompt)) return;
    if (demoMode) {
      const nextTopups = rows.map(item => item.id === row.id ? { ...item, status: decision === "approve" ? "approved" : "rejected" } : item);
      window.localStorage.setItem(`${DEMO_STORAGE}:topups`, JSON.stringify(nextTopups));
      if (decision === "approve") {
        const walletKey = `${DEMO_STORAGE}:wallets`;
        const wallets = JSON.parse(window.localStorage.getItem(walletKey) || JSON.stringify(demoRows("wallets"))) as Row[];
        const technicianId = String(row.technicianId || row.userId || row.uid || "");
        const wallet = wallets.find(item => item.id === technicianId);
        if (wallet) {
          const balanceBefore = Number(wallet.balance || 0);
          const balanceAfter = balanceBefore + amount;
          window.localStorage.setItem(walletKey, JSON.stringify(wallets.map(item => item.id === technicianId ? { ...item, balance: balanceAfter } : item)));
          const ledgerKey = `${DEMO_STORAGE}:walletTransactions`;
          const ledger = JSON.parse(window.localStorage.getItem(ledgerKey) || "[]") as Row[];
          window.localStorage.setItem(ledgerKey, JSON.stringify([{ id: `demo-ledger-${Date.now()}`, technicianId, type: "topup", amount, balanceBefore, balanceAfter, createdAt: new Date().toISOString() }, ...ledger]));
        }
      }
      setRows(nextTopups);
      return;
    }
    if (!app) return onError("Firebase belum dikonfigurasi.");
    setSaving(true);
    try {
      const call = httpsCallable(getFunctions(app), "reviewTechnicianTopup");
      await call({ topupId: row.id, decision });
      await load();
    } catch (error: any) { onError(error?.message || "Top-up gagal diproses."); }
    finally { setSaving(false); }
  }
  async function showWalletHistory(wallet: Row) {
    setHistoryFor(wallet);
    setHistoryRows([]);
    setHistoryLoading(true);
    try {
      if (demoMode) {
        const history = JSON.parse(window.localStorage.getItem(`${DEMO_STORAGE}:walletTransactions`) || "[]") as Row[];
        setHistoryRows(history.filter(item => item.technicianId === wallet.id));
        return;
      }
      if (!db) throw new Error("Firebase belum dikonfigurasi.");
      const snapshot = await getDocs(query(collection(db!, "walletTransactions"), where("technicianId", "==", wallet.id), orderBy("createdAt", "desc"), limit(100)));
      setHistoryRows(snapshot.docs.map(item => ({ id: item.id, ...item.data() } as Row)));
    } catch (error: any) { onError(error?.message || "Histori saldo gagal dimuat."); }
    finally { setHistoryLoading(false); }
  }
  async function showTopupProof(row: Row) {
    try {
      const url = row.proofUrl || row.receiptUrl || (row.proofPath && app ? await getDownloadURL(ref(getStorage(app), row.proofPath)) : "");
      if (!url) throw new Error("Bukti transfer belum tersedia.");
      setProofPreview(url);
    } catch (error: any) { onError(error?.message || "Bukti transfer gagal dibuka."); }
  }
  async function saveBilling() {
    if (!db && !demoMode) return;
    setSaving(true);
    try {
      const payload = Object.fromEntries((config.fields || []).map(field => [field.key, Number(draft[field.key] ?? rows[0]?.[field.key] ?? 0)]));
      if (demoMode) {
        const next = [{ ...rows[0], ...payload, id: "billing" }];
        window.localStorage.setItem(`${DEMO_STORAGE}:billing`, JSON.stringify(next)); setRows(next);
      } else {
        await setDoc(doc(db!, "settings", "billing"), { ...payload, updatedAt: serverTimestamp() }, { merge: true });
        await load();
      }
    } catch (error: any) { onError(error?.message || "Tarif gagal disimpan."); }
    finally { setSaving(false); }
  }
  function toggleDemo() {
    const next = !demoMode;
    window.localStorage.setItem(`${DEMO_STORAGE}:enabled`, next ? "1" : "0");
    setDemoMode(next); setEditing(null); setSearch("");
  }
  function resetDemo() {
    window.localStorage.removeItem(`${DEMO_STORAGE}:${module}`);
    void load();
  }

  async function importLegacyGeography() {
    if (!db || demoMode || geoSyncing) return;
    setGeoSyncing(true);
    try {
      const [provinceSnap, citySnap, subdistrictSnap] = await Promise.all([
        getDocs(collection(db, "provinces")),
        getDocs(collection(db, "cities")),
        getDocs(collection(db, "subdistricts"))
      ]);
      const existingProvinces = new Set(provinceSnap.docs.map(item => geographyId(String(item.data().name || ""))));
      const existingAreas = new Set(citySnap.docs.map(item => `${geographyId(String(item.data().name || ""))}|${geographyId(String(item.data().province || ""))}`));
      const existingCities = new Set(subdistrictSnap.docs.map(item => `${geographyId(String(item.data().name || ""))}|${geographyId(String(item.data().city || ""))}|${geographyId(String(item.data().province || ""))}`));
      const uniqueAreas = Array.from(new Map(legacyAreaCityPairs.map(item => [`${item.area.toLowerCase()}|${item.regional.toLowerCase()}`, { name: item.area, province: item.regional }])).values());
      const pending: Array<{ collectionName: string; id: string; data: Record<string, string> }> = [];
      for (const name of legacyRegionalNames) if (!existingProvinces.has(geographyId(name))) pending.push({ collectionName: "provinces", id: `legacy-${geographyId(name)}`, data: { name } });
      for (const area of uniqueAreas) {
        const key = `${geographyId(area.name)}|${geographyId(area.province)}`;
        if (!existingAreas.has(key)) pending.push({ collectionName: "cities", id: `legacy-${geographyId(area.name)}-${geographyId(area.province)}`, data: area });
      }
      for (const item of legacyAreaCityPairs) {
        const key = `${geographyId(item.city)}|${geographyId(item.area)}|${geographyId(item.regional)}`;
        if (!existingCities.has(key)) pending.push({ collectionName: "subdistricts", id: `legacy-${geographyId(item.area)}-${geographyId(item.city)}-${geographyId(item.regional)}`, data: { name: item.city, city: item.area, province: item.regional } });
      }
      if (pending.length) {
        const batch = writeBatch(db);
        for (const entry of pending) batch.set(doc(db, entry.collectionName, entry.id), { ...entry.data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
        await batch.commit();
      }
      await load();
      window.alert(pending.length ? `${pending.length} data lokasi berhasil ditambahkan. Data yang sudah ada dilewati.` : "Semua data lokasi dari daftar lama sudah tersedia.");
    } catch (error: any) { onError(error?.message || "Data lokasi lama gagal ditambahkan."); }
    finally { setGeoSyncing(false); }
  }

  return <section className="admin-panel admin-data-panel">
    <div className="admin-module-heading">
      <div><span>ADMINISTRASI</span><h2>{config.title}</h2><p>{config.subtitle}</p></div>
      <div className="admin-module-tools">
        {module !== "billing" && <label className="admin-search"><Search size={17}/><input aria-label="Cari" value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari data..."/></label>}
        {demoMode && <button className="admin-demo-reset" onClick={resetDemo}>Reset contoh</button>}
        <button className={`admin-demo-toggle ${demoMode ? "active" : ""}`} onClick={toggleDemo}>{demoMode ? "Keluar mode demo" : "Lihat mode demo"}</button>
        <button className="admin-refresh" onClick={load} disabled={loading}><RefreshCw size={15}/> Muat ulang</button>
        {module === "provinces" && !demoMode && <button className="admin-refresh" onClick={() => setGeoConfirmOpen(true)} disabled={geoSyncing || loading}>{geoSyncing ? <Loader2 className="spin" size={15}/> : <Plus size={15}/>} Impor data lama</button>}
        {config.fields && module !== "billing" && <button className="admin-module-add" onClick={startCreate}><Plus size={16}/> Tambah data</button>}
      </div>
    </div>

    {demoMode && <div className="admin-demo-banner"><b>Mode demo aktif</b><span>Data contoh dan aksi di halaman ini hanya tersimpan di browser ini. Firestore tidak berubah.</span></div>}

    {module === "incomes" && <div className="admin-module-total"><span>Pendapatan tercatat pada sampel selesai</span><b>{rupiah(incomeTotal)}</b><small>{rows.length} laporan selesai yang termuat</small></div>}
    {module === "billing" && <div className="admin-billing-card"><div><h3>Konfigurasi tarif</h3><p>{demoMode ? "Data contoh lokal untuk presentasi." : "Pengaturan ini disimpan di settings/billing."}</p></div>{config.fields?.map(field => <label className="admin-module-field" key={field.key}>{field.label}<input type="number" min="0" value={draft[field.key] ?? rows[0]?.[field.key] ?? ""} onChange={e => setDraft(current => ({ ...current, [field.key]: e.target.value }))}/></label>)}<button className="admin-module-add" disabled={saving} onClick={saveBilling}><Check size={15}/> Simpan tarif</button></div>}

    {editing && config.fields && module !== "billing" && <form className="admin-module-form" onSubmit={save}>
      <div className="admin-module-form-head"><h3>{editing.id ? "Ubah data" : "Tambah data"}</h3><button type="button" aria-label="Tutup" onClick={() => setEditing(null)}><X size={17}/></button></div>
      <div className="admin-module-form-grid">{config.fields.map(field => <label className="admin-module-field" key={field.key}>{field.type === "checkbox" ? <span><input type="checkbox" checked={Boolean(draft[field.key])} onChange={e => setDraft(current => ({ ...current, [field.key]: e.target.checked }))}/> {field.label}</span> : <>{field.label}{field.type === "textarea" ? <textarea required={field.required} value={draft[field.key] ?? ""} onChange={e => setDraft(current => ({ ...current, [field.key]: e.target.value }))}/> : <input required={field.required} type={field.type === "number" ? "number" : "text"} min={field.type === "number" ? "0" : undefined} value={draft[field.key] ?? ""} onChange={e => setDraft(current => ({ ...current, [field.key]: e.target.value }))}/>}</>}</label>)}</div>
      <div className="admin-module-form-actions"><button type="button" className="admin-module-cancel" onClick={() => setEditing(null)}>Batal</button><button type="submit" className="admin-module-add" disabled={saving}>{saving ? <Loader2 className="spin" size={15}/> : <Check size={15}/>} Simpan</button></div>
    </form>}

    <div className="admin-table-wrap"><table className="admin-table"><thead><tr>
      {(module === "transactions" ? ["Laporan", "Customer", "Layanan", "Status", "Nominal", "Dibuat"] : module === "incomes" ? ["Laporan", "Customer", "Status", "Nominal", "Selesai"] : module === "wallets" ? ["Teknisi", "Email", "Saldo", "Status", "Aksi"] : module === "topups" ? ["Teknisi", "Sumber Transfer", "Rekening Tujuan", "Tanggal / Jam", "Nominal", "Status", "Bukti", "Aksi"] : module === "reviews" ? ["Laporan", "Customer", "Teknisi", "Rating", "Ulasan", "Tanggal"] : module === "billing" ? [] : [...(config.fields || []).map(f => f.label), "Aksi"]).map(column => <th key={column}>{column}</th>)}
    </tr></thead><tbody>
      {visibleRows.map(row => <tr key={row.id}>
        {module === "transactions" && <><td><b>NYL-{row.id.slice(0, 8).toUpperCase()}</b></td><td>{row.customerName || "—"}</td><td>{row.problemType || "—"}</td><td>{labelStatus(row.status)}</td><td>{amountOf(row) ? rupiah(amountOf(row)) : "Belum tercatat"}</td><td>{formatDate(row.createdAt)}</td></>}
        {module === "incomes" && <><td><b>NYL-{row.id.slice(0, 8).toUpperCase()}</b></td><td>{row.customerName || "—"}</td><td>{labelStatus(row.status)}</td><td>{amountOf(row) ? rupiah(amountOf(row)) : "Nominal belum tercatat"}</td><td>{formatDate(row.completedAt || row.updatedAt)}</td></>}
        {module === "wallets" && <><td>{row.name || "—"}</td><td>{row.email || "—"}</td><td><b>{rupiah(Number(row.balance || 0))}</b></td><td>{labelStatus(row.status)}</td><td><div className="admin-module-row-actions"><button onClick={() => showWalletHistory(row)}>Histori saldo</button></div></td></>}
        {module === "topups" && <><td>{row.technicianName || row.userName || row.technicianId || row.userId || "—"}<small className="table-sub">{row.technicianEmail || ""}</small></td><td>{row.sourceName || "—"}<small className="table-sub">{labelStatus(row.sourceType)}</small></td><td>{row.bankName || row.bank || "—"}<small className="table-sub">{row.accountNumber || ""}{row.accountName ? ` · ${row.accountName}` : ""}</small></td><td>{row.transferDate || "—"}<small className="table-sub">{row.transferTime || ""}</small></td><td>{rupiah(amountOf(row))}</td><td>{labelStatus(row.status)}</td><td>{row.proofPath || row.proofUrl || row.receiptUrl ? <button className="admin-module-proof-link" onClick={() => showTopupProof(row)}>Lihat bukti</button> : "—"}</td><td>{isPending(row.status) ? <div className="admin-module-row-actions"><button disabled={saving} onClick={() => reviewTopup(row, "approve")}>Konfirmasi</button><button className="danger" disabled={saving} onClick={() => reviewTopup(row, "reject")}>Tolak</button></div> : "—"}</td></>}
        {module === "reviews" && <><td>{row.reportId || "—"}</td><td>{row.customerName || "—"}</td><td>{row.technicianId || "—"}</td><td>★ {Number(row.rating || 0)}</td><td>{row.comment || "—"}</td><td>{formatDate(row.createdAt)}</td></>}
        {config.fields && module !== "transactions" && module !== "incomes" && module !== "wallets" && module !== "topups" && module !== "billing" && <>{config.fields.map(field => <td key={field.key}>{field.type === "checkbox" ? (row[field.key] === false ? "Nonaktif" : "Aktif") : field.type === "number" && field.key.toLowerCase().includes("price") ? rupiah(Number(row[field.key] || 0)) : String(row[field.key] ?? "—")}</td>)}<td><div className="admin-module-row-actions"><button aria-label="Ubah" onClick={() => startEdit(row)}><Pencil size={14}/></button><button className="danger" aria-label="Hapus" onClick={() => remove(row)}><Trash2 size={14}/></button></div></td></>}
      </tr>)}
    </tbody></table>
      {loading && <div className="empty-admin"><Loader2 size={17} className="spin"/> Memuat data…</div>}
      {!loading && !visibleRows.length && module !== "billing" && <div className="empty-admin"><AlertCircle size={17}/> {demoMode ? "Belum ada contoh data." : "Belum ada data pada Firebase untuk bagian ini."}</div>}
      {!loading && module === "topups" && <p className="admin-module-note">{demoMode ? "Konfirmasi hanya mengubah data contoh lokal." : "Cocokkan nominal, rekening tujuan, tanggal dan jam, serta bukti transfer dengan mutasi rekening sebelum menyetujui. Saldo teknisi bertambah setelah persetujuan admin."}</p>}
      {!loading && (module === "transactions" || module === "incomes") && <p className="admin-module-note">Data dibaca dari koleksi `reports`. Nominal hanya dihitung bila dokumen laporan memiliki field nominal.</p>}
    </div>
    {proofPreview && <div className="admin-history-backdrop" onClick={() => setProofPreview("")}><section className="admin-history-modal admin-proof-modal" role="dialog" aria-modal="true" aria-label="Bukti transfer" onClick={event => event.stopPropagation()}><header><div><span>BUKTI TRANSFER</span><h3>Periksa gambar bukti</h3></div><button aria-label="Tutup" onClick={() => setProofPreview("")}><X size={18}/></button></header><img src={proofPreview} alt="Bukti transfer top-up"/></section></div>}
    {geoConfirmOpen && <div className="approval-modal-backdrop" onClick={() => !geoSyncing && setGeoConfirmOpen(false)}><section className="approval-modal" role="dialog" aria-modal="true" aria-labelledby="geo-import-title" onClick={event => event.stopPropagation()}><span className="admin-kicker">DATA LOKASI</span><h2 id="geo-import-title">Impor data lama?</h2><p>Data pada gambar akan ditambahkan ke Regional, Area layanan, dan Kota/Kecamatan. Data yang sudah cocok akan dilewati, tanpa mengubah data lain.</p><div className="approval-actions"><button className="btn btn-secondary" disabled={geoSyncing} onClick={() => setGeoConfirmOpen(false)}>Batal</button><button className="admin-module-add" disabled={geoSyncing} onClick={() => { setGeoConfirmOpen(false); void importLegacyGeography(); }}>{geoSyncing ? <Loader2 className="spin" size={15}/> : <Check size={15}/>} Impor data</button></div></section></div>}
    {historyFor && <div className="admin-history-backdrop" onClick={() => setHistoryFor(null)}><section className="admin-history-modal" role="dialog" aria-modal="true" aria-labelledby="wallet-history-title" onClick={event => event.stopPropagation()}><header><div><span>DOMPET TEKNISI</span><h3 id="wallet-history-title">Histori saldo · {historyFor.name || historyFor.email || historyFor.id}</h3></div><button aria-label="Tutup" onClick={() => setHistoryFor(null)}><X size={18}/></button></header><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Jenis</th><th>Nominal</th><th>Saldo setelah</th><th>Tanggal</th></tr></thead><tbody>{historyRows.map(item => <tr key={item.id}><td>{labelStatus(item.type)}</td><td>{rupiah(Number(item.amount || 0))}</td><td>{rupiah(Number(item.balanceAfter || 0))}</td><td>{formatDate(item.createdAt)}</td></tr>)}</tbody></table>{historyLoading && <div className="empty-admin">Memuat histori…</div>}{!historyLoading && !historyRows.length && <div className="empty-admin">Belum ada histori saldo.</div>}</div></section></div>}
  </section>;
}

function isPending(status: unknown) { return ["pending", "on check", "on_check", "waiting", "menunggu"].includes(String(status || "").trim().toLowerCase()); }
function formatDate(value: any) { const date = typeof value?.toDate === "function" ? value.toDate() : value ? new Date(value) : null; return date && !Number.isNaN(date.getTime()) ? date.toLocaleString("id-ID", { dateStyle: "short", timeStyle: "short" }) : "—"; }
