"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Clock, MapPin, RefreshCw, LogOut, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { collection, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { signOut } from "firebase/auth";

interface Report {
  id: string;
  problem: string;
  description: string;
  status: "pending" | "in_progress" | "completed";
  location: { lat: number; lng: number };
  createdAt: number;
}

const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  pending: { label: "Menunggu Respons", color: "var(--accent-amber)", bgColor: "rgba(245, 158, 11, 0.1)" },
  in_progress: { label: "Dalam Proses", color: "var(--accent-blue)", bgColor: "rgba(59, 130, 246, 0.1)" },
  completed: { label: "Selesai", color: "var(--accent-emerald)", bgColor: "rgba(16, 185, 129, 0.1)" },
};

export default function ReportsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth!, (currentUser) => {
      setUser(currentUser && !currentUser.isAnonymous ? currentUser : null);
      setAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user || !db) return;

    const q = query(
      collection(db, "reports"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const reportsData: Report[] = [];
      snapshot.forEach((doc) => {
        reportsData.push({ id: doc.id, ...doc.data() } as Report);
      });
      setReports(reportsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleLogout = async () => {
    try {
      if (!auth) return;
      await signOut(auth);
      window.location.href = "/";
    } catch (err) {
      console.error("Logout failed:", err);
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
            <Zap size={24} />
            NyalaLagi
          </Link>
          <button onClick={handleLogout} className="btn btn-secondary btn-sm">
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="section">
        <div className="container">
          <div style={{ maxWidth: "900px", margin: "0 auto" }}>
            {/* Header */}
            <div style={{ marginBottom: "var(--space-3xl)" }}>
              <Link href="/" className="btn btn-ghost btn-sm" style={{ marginBottom: "var(--space-lg)" }}>
                <ArrowLeft size={16} />
                Kembali
              </Link>
              <h1 style={{ marginBottom: "var(--space-md)" }}>Daftar Laporan Anda</h1>
              <p style={{ color: "var(--gray-400)" }}>
                Pantau status semua laporan kerusakan listrik yang telah Anda buat.
              </p>
            </div>

            {/* Reports List */}
            {loading ? (
              <div className="glass-card" style={{ textAlign: "center", padding: "var(--space-3xl)" }}>
                <div className="loading" style={{ justifyContent: "center" }}>
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            ) : reports.length === 0 ? (
              <div className="glass-card" style={{ textAlign: "center", padding: "var(--space-3xl)" }}>
                <Zap size={48} style={{ color: "var(--accent-blue)", marginBottom: "var(--space-lg)", opacity: 0.5 }} />
                <h3 style={{ marginBottom: "var(--space-md)" }}>Belum Ada Laporan</h3>
                <p style={{ color: "var(--gray-400)", marginBottom: "var(--space-2xl)" }}>
                  Anda belum membuat laporan kerusakan. Mulai dengan membuat laporan baru sekarang.
                </p>
                <Link href="/lapor" className="btn btn-primary">
                  <Zap size={18} />
                  Buat Laporan Pertama
                </Link>
              </div>
            ) : (
              <div style={{ display: "grid", gap: "var(--space-2xl)" }}>
                {reports.map((report) => {
                  const config = statusConfig[report.status];
                  return (
                    <div key={report.id} className="glass-card">
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr auto",
                          gap: "var(--space-2xl)",
                          alignItems: "start",
                        }}
                      >
                        {/* Info */}
                        <div>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "var(--space-lg)",
                              marginBottom: "var(--space-lg)",
                            }}
                          >
                            <h4 style={{ margin: 0, flex: 1 }}>{report.problem}</h4>
                            <span
                              className="badge"
                              style={{
                                background: config.bgColor,
                                color: config.color,
                                border: `1px solid ${config.color}`,
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "var(--space-sm)",
                              }}
                            >
                              {report.status === "pending" && <Clock size={14} />}
                              {report.status === "in_progress" && <RefreshCw size={14} style={{ animation: "spin 2s linear infinite" }} />}
                              {report.status === "completed" && <CheckCircle2 size={14} />}
                              {config.label}
                            </span>
                          </div>

                          <p style={{ color: "var(--gray-300)", margin: "var(--space-md) 0" }}>
                            {report.description}
                          </p>

                          <div
                            style={{
                              display: "grid",
                              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                              gap: "var(--space-lg)",
                              marginTop: "var(--space-lg)",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "var(--space-md)",
                                padding: "var(--space-md)",
                                borderRadius: "var(--radius-md)",
                                background: "rgba(59, 130, 246, 0.1)",
                              }}
                            >
                              <MapPin size={18} style={{ color: "var(--accent-blue)" }} />
                              <div style={{ fontSize: "0.875rem" }}>
                                <p style={{ margin: 0, color: "var(--gray-400)" }}>Lokasi</p>
                                <p style={{ margin: 0, fontWeight: "600" }}>
                                  {report.location.lat.toFixed(4)}, {report.location.lng.toFixed(4)}
                                </p>
                              </div>
                            </div>

                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "var(--space-md)",
                                padding: "var(--space-md)",
                                borderRadius: "var(--radius-md)",
                                background: "rgba(6, 182, 212, 0.1)",
                              }}
                            >
                              <Clock size={18} style={{ color: "var(--accent-cyan)" }} />
                              <div style={{ fontSize: "0.875rem" }}>
                                <p style={{ margin: 0, color: "var(--gray-400)" }}>Tanggal Lapor</p>
                                <p style={{ margin: 0, fontWeight: "600" }}>
                                  {new Date(report.createdAt).toLocaleDateString("id-ID", {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Action */}
                        <div>
                          <Link href={`/laporan/${report.id}`} className="btn btn-primary">
                            <CheckCircle2 size={16} />
                            Detail
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Info Box */}
            {reports.length > 0 && (
              <div
                style={{
                  marginTop: "var(--space-3xl)",
                  padding: "var(--space-2xl)",
                  borderRadius: "var(--radius-lg)",
                  border: "1px solid var(--glass-border)",
                  background: "rgba(16, 185, 129, 0.05)",
                }}
              >
                <div style={{ display: "flex", gap: "var(--space-lg)", alignItems: "flex-start" }}>
                  <CheckCircle2 size={24} style={{ color: "var(--accent-emerald)", flexShrink: 0 }} />
                  <div>
                    <h5 style={{ marginBottom: "var(--space-md)" }}>Bagaimana Cara Kerjanya?</h5>
                    <ol style={{ paddingLeft: "var(--space-lg)", color: "var(--gray-300)", fontSize: "0.95rem" }}>
                      <li style={{ marginBottom: "var(--space-sm)" }}>
                        <strong>Laporan Dibuat:</strong> Laporan Anda telah kami terima dan akan segera diproses.
                      </li>
                      <li style={{ marginBottom: "var(--space-sm)" }}>
                        <strong>Teknisi Ditugaskan:</strong> Kami akan menugaskan teknisi terbaik untuk masalah Anda.
                      </li>
                      <li style={{ marginBottom: "var(--space-sm)" }}>
                        <strong>Dalam Proses:</strong> Teknisi akan memperbaiki masalah listrik Anda.
                      </li>
                      <li>
                        <strong>Selesai:</strong> Perbaikan telah selesai. Hubungi kami jika ada masalah lebih lanjut.
                      </li>
                    </ol>
                  </div>
                </div>
              </div>
            )}

            {/* CTA */}
            {reports.length > 0 && (
              <div style={{ marginTop: "var(--space-3xl)", textAlign: "center" }}>
                <p style={{ color: "var(--gray-400)", marginBottom: "var(--space-lg)" }}>
                  Ada masalah listrik lagi? Buat laporan baru sekarang.
                </p>
                <Link href="/lapor" className="btn btn-primary btn-lg">
                  <Zap size={20} />
                  Buat Laporan Baru
                </Link>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
