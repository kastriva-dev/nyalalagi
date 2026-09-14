"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { Activity, BarChart3, ChevronDown, CircleDollarSign, ClipboardList, LogOut, Menu, Search, ShieldCheck, UserRound, Users, X, MapPin, Pencil, Eye, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { auth, db } from "@/lib/firebase";
import { getUserProfile } from "@/lib/user";
import { useRouter } from "next/navigation";

interface Report {
  id: string;
  problem: string;
  description: string;
  status: "pending" | "in_progress" | "completed";
  location: { lat: number; lng: number };
  createdAt: number;
  userId: string;
  userEmail: string;
}

interface Stats {
  totalReports: number;
  pendingReports: number;
  completedReports: number;
  totalUsers: number;
}

export default function AdminPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalReports: 0,
    pendingReports: 0,
    completedReports: 0,
    totalUsers: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "in_progress" | "completed">("all");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth!, async (currentUser) => {
      if (currentUser && !currentUser.isAnonymous) {
        try {
          const profile = await getUserProfile(currentUser.uid);
          if (profile?.role === "admin") {
            setUser(currentUser);
          } else {
            router.push("/");
          }
        } catch {
          router.push("/");
        }
      } else {
        router.push("/login");
      }
      setAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user || !db) return;

    const unsubscribe = onSnapshot(collection(db, "reports"), (snapshot) => {
      const reportsData: Report[] = [];
      let pending = 0,
        completed = 0;

      snapshot.forEach((doc) => {
        const data = doc.data();
        reportsData.push({ id: doc.id, ...data } as Report);
        if (data.status === "pending" || data.status === "in_progress") pending++;
        if (data.status === "completed") completed++;
      });

      setReports(reportsData.sort((a, b) => b.createdAt - a.createdAt));
      setStats((prev) => ({
        ...prev,
        totalReports: reportsData.length,
        pendingReports: pending,
        completedReports: completed,
      }));
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const filteredReports = useMemo(() => {
    return reports.filter((report) => {
      const matchesSearch = report.problem.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.userEmail.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === "all" || report.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [reports, searchTerm, filterStatus]);

  const handleLogout = async () => {
    try {
      if (!auth) return;
      await signOut(auth);
      router.push("/");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <span className="badge badge-warning" style={{ display: "inline-flex", alignItems: "center", gap: "var(--space-sm)" }}><Clock size={14} /> Pending</span>;
      case "in_progress":
        return <span className="badge" style={{ display: "inline-flex", alignItems: "center", gap: "var(--space-sm)" }}><Activity size={14} /> In Progress</span>;
      case "completed":
        return <span className="badge badge-success" style={{ display: "inline-flex", alignItems: "center", gap: "var(--space-sm)" }}><CheckCircle2 size={14} /> Completed</span>;
      default:
        return <span className="badge">{status}</span>;
    }
  };

  if (!authReady || !user) {
    return (
      <div className="hero">
        <div className="loading">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Navigation */}
      <nav>
        <div className="nav-inner">
          <Link href="/" className="nav-brand">
            <ShieldCheck size={24} />
            Admin Dashboard
          </Link>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="btn btn-ghost btn-icon"
            style={{ display: "none" }}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <button onClick={handleLogout} className="btn btn-secondary btn-sm">
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="section">
        <div className="container">
          {/* Header */}
          <div style={{ marginBottom: "var(--space-3xl)" }}>
            <h1 style={{ marginBottom: "var(--space-md)" }}>Dashboard Admin</h1>
            <p style={{ color: "var(--gray-400)" }}>Kelola laporan kerusakan dan pantau status perbaikan.</p>
          </div>

          {/* Stats Grid */}
          <div className="card-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", marginBottom: "var(--space-3xl)" }}>
            <div className="glass-card">
              <div className="card-header">
                <div className="card-icon" style={{ background: "linear-gradient(135deg, rgba(59, 130, 246, 0.3), rgba(59, 130, 246, 0.1))" }}>
                  <ClipboardList size={24} style={{ color: "var(--accent-blue)" }} />
                </div>
                <div>
                  <p style={{ fontSize: "0.875rem", color: "var(--gray-400)", margin: 0 }}>Total Laporan</p>
                  <h3 style={{ margin: 0, fontSize: "1.75rem" }}>{stats.totalReports}</h3>
                </div>
              </div>
            </div>

            <div className="glass-card">
              <div className="card-header">
                <div className="card-icon" style={{ background: "linear-gradient(135deg, rgba(245, 158, 11, 0.3), rgba(245, 158, 11, 0.1))" }}>
                  <AlertCircle size={24} style={{ color: "var(--accent-amber)" }} />
                </div>
                <div>
                  <p style={{ fontSize: "0.875rem", color: "var(--gray-400)", margin: 0 }}>Menunggu Respon</p>
                  <h3 style={{ margin: 0, fontSize: "1.75rem" }}>{stats.pendingReports}</h3>
                </div>
              </div>
            </div>

            <div className="glass-card">
              <div className="card-header">
                <div className="card-icon" style={{ background: "linear-gradient(135deg, rgba(16, 185, 129, 0.3), rgba(16, 185, 129, 0.1))" }}>
                  <CheckCircle2 size={24} style={{ color: "var(--accent-emerald)" }} />
                </div>
                <div>
                  <p style={{ fontSize: "0.875rem", color: "var(--gray-400)", margin: 0 }}>Selesai</p>
                  <h3 style={{ margin: 0, fontSize: "1.75rem" }}>{stats.completedReports}</h3>
                </div>
              </div>
            </div>

            <div className="glass-card">
              <div className="card-header">
                <div className="card-icon" style={{ background: "linear-gradient(135deg, rgba(6, 182, 212, 0.3), rgba(6, 182, 212, 0.1))" }}>
                  <Users size={24} style={{ color: "var(--accent-cyan)" }} />
                </div>
                <div>
                  <p style={{ fontSize: "0.875rem", color: "var(--gray-400)", margin: 0 }}>Total Pengguna</p>
                  <h3 style={{ margin: 0, fontSize: "1.75rem" }}>{stats.totalUsers}</h3>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="glass-card" style={{ marginBottom: "var(--space-3xl)", padding: "var(--space-lg)" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "var(--space-lg)" }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Cari Laporan</label>
                <div style={{ position: "relative" }}>
                  <Search size={18} style={{ position: "absolute", left: "var(--space-lg)", top: "50%", transform: "translateY(-50%)", color: "var(--gray-400)", pointerEvents: "none" }} />
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Cari berdasarkan jenis atau email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ paddingLeft: "2.5rem" }}
                  />
                </div>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Filter Status</label>
                <select
                  className="form-select"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                >
                  <option value="all">Semua Status</option>
                  <option value="pending">Menunggu</option>
                  <option value="in_progress">Dalam Proses</option>
                  <option value="completed">Selesai</option>
                </select>
              </div>
            </div>
          </div>

          {/* Reports Table */}
          <div className="glass-card" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--glass-border)" }}>
                    <th style={{ padding: "var(--space-lg)", textAlign: "left", fontWeight: "600", color: "var(--gray-300)" }}>Jenis Masalah</th>
                    <th style={{ padding: "var(--space-lg)", textAlign: "left", fontWeight: "600", color: "var(--gray-300)" }}>Email Pelanggan</th>
                    <th style={{ padding: "var(--space-lg)", textAlign: "left", fontWeight: "600", color: "var(--gray-300)" }}>Status</th>
                    <th style={{ padding: "var(--space-lg)", textAlign: "left", fontWeight: "600", color: "var(--gray-300)" }}>Tanggal</th>
                    <th style={{ padding: "var(--space-lg)", textAlign: "center", fontWeight: "600", color: "var(--gray-300)" }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={5} style={{ padding: "var(--space-3xl)", textAlign: "center" }}>
                        <div className="loading">
                          <span></span>
                          <span></span>
                          <span></span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredReports.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ padding: "var(--space-3xl)", textAlign: "center", color: "var(--gray-400)" }}>
                        Tidak ada laporan ditemukan
                      </td>
                    </tr>
                  ) : (
                    filteredReports.map((report) => (
                      <tr key={report.id} style={{ borderBottom: "1px solid var(--glass-border)", transition: "background-color var(--transition-fast)" }}>
                        <td style={{ padding: "var(--space-lg)", color: "var(--white)" }}>
                          <strong>{report.problem}</strong>
                        </td>
                        <td style={{ padding: "var(--space-lg)", color: "var(--gray-300)" }}>{report.userEmail}</td>
                        <td style={{ padding: "var(--space-lg)" }}>{getStatusBadge(report.status)}</td>
                        <td style={{ padding: "var(--space-lg)", color: "var(--gray-400)" }}>
                          {new Date(report.createdAt).toLocaleDateString("id-ID")}
                        </td>
                        <td style={{ padding: "var(--space-lg)", textAlign: "center" }}>
                          <Link href={`/admin/lapor/${report.id}`} className="btn btn-secondary btn-sm">
                            <Eye size={16} />
                            Lihat
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination Info */}
          <div style={{ marginTop: "var(--space-lg)", textAlign: "center", color: "var(--gray-400)", fontSize: "0.875rem" }}>
            Menampilkan {filteredReports.length} dari {reports.length} laporan
          </div>
        </div>
      </main>
    </>
  );
}
