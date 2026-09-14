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
  "Listrik padam total",
  "Listrik padam sebagian",
  "Sering konslet",
  "Instalasi kurang aman",
  "Perlu penambahan titik",
  "Lainnya",
];

export default function ReportPage() {
  const [user, setUser] = useState<User | null>(null);
  const [problem, setProblem] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    if (!firebaseReady) {
      setAuthReady(true);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth!, (currentUser) => {
      setUser(currentUser && !currentUser.isAnonymous ? currentUser : null);
      setAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!problem || !description || !location) {
      setError("Mohon lengkapi semua field yang diperlukan");
      return;
    }

    setLoading(true);
    try {
      if (!user || !location) {
        setError("Data tidak lengkap");
        setLoading(false);
        return;
      }

      await createReport({
        uid: user.uid,
        name: user.displayName || user.email?.split("@")[0] || "User",
        phone: "",
        problemType: problem,
        description,
        location: {
          latitude: location.lat,
          longitude: location.lng,
          capturedAt: new Date().toISOString(),
        },
        photos: image ? [image] : [],
      });
      setSuccess(true);
      setTimeout(() => {
        window.location.href = "/";
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Gagal membuat laporan");
    } finally {
      setLoading(false);
    }
  };

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
          <div style={{ maxWidth: "720px", margin: "0 auto" }}>
            {/* Header */}
            <div style={{ marginBottom: "var(--space-3xl)" }}>
              <Link href="/" className="btn btn-ghost btn-sm" style={{ marginBottom: "var(--space-lg)" }}>
                <ArrowLeft size={16} />
                Kembali
              </Link>
              <h1 style={{ marginBottom: "var(--space-md)" }}>Buat Laporan Kerusakan</h1>
              <p style={{ color: "var(--gray-400)" }}>
                Laporkan masalah kelistrikan yang Anda alami. Tim teknisi kami akan segera merespons.
              </p>
            </div>

            {/* Form Card */}
            <div className="glass-card">
              {/* Success Message */}
              {success && (
                <div
                  className="alert alert-success"
                  style={{ marginBottom: "var(--space-lg)", display: "flex", alignItems: "center", gap: "var(--space-md)" }}
                >
                  <CheckCircle2 size={20} />
                  <div>
                    <strong>Laporan Berhasil Dibuat!</strong>
                    <p style={{ fontSize: "0.875rem", marginTop: "var(--space-sm)" }}>
                      Tim teknisi kami akan menghubungi Anda segera.
                    </p>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="alert alert-error" style={{ marginBottom: "var(--space-lg)" }}>
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "var(--space-2xl)" }}>
                {/* Problem Type */}
                <div className="form-group">
                  <label className="form-label">
                    <Zap size={16} style={{ display: "inline", marginRight: "var(--space-sm)" }} />
                    Jenis Masalah
                  </label>
                  <select
                    className="form-select"
                    value={problem}
                    onChange={(e) => setProblem(e.target.value)}
                    required
                  >
                    <option value="">Pilih jenis masalah</option>
                    {problems.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Description */}
                <div className="form-group">
                  <label className="form-label">Deskripsi Masalah</label>
                  <textarea
                    className="form-textarea"
                    placeholder="Jelaskan masalah yang Anda alami dengan detail..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                  />
                  <p style={{ fontSize: "0.875rem", color: "var(--gray-400)" }}>
                    {description.length}/500 karakter
                  </p>
                </div>

                {/* Location */}
                <div className="form-group">
                  <label className="form-label">
                    <MapPin size={16} style={{ display: "inline", marginRight: "var(--space-sm)" }} />
                    Lokasi Masalah
                  </label>
                  <LocationPicker
                    onLocationChange={setLocation}
                    currentLocation={location}
                  />
                </div>

                {/* Image Upload */}
                <div className="form-group">
                  <label className="form-label">
                    <Camera size={16} style={{ display: "inline", marginRight: "var(--space-sm)" }} />
                    Foto Masalah
                  </label>

                  {imagePreview ? (
                    <div
                      style={{
                        position: "relative",
                        borderRadius: "var(--radius-lg)",
                        overflow: "hidden",
                        border: "1px solid var(--glass-border)",
                      }}
                    >
                      <img
                        src={imagePreview}
                        alt="Preview"
                        style={{
                          width: "100%",
                          height: "300px",
                          objectFit: "cover",
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setImage(null);
                          setImagePreview("");
                        }}
                        style={{
                          position: "absolute",
                          top: "var(--space-md)",
                          right: "var(--space-md)",
                          background: "rgba(0,0,0,0.6)",
                          border: "none",
                          borderRadius: "var(--radius-full)",
                          color: "white",
                          cursor: "pointer",
                          padding: "var(--space-md)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <X size={20} />
                      </button>
                    </div>
                  ) : (
                    <label
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "var(--space-3xl) var(--space-lg)",
                        border: "2px dashed var(--glass-border)",
                        borderRadius: "var(--radius-lg)",
                        cursor: "pointer",
                        transition: "all var(--transition-base)",
                        backgroundColor: "rgba(59, 130, 246, 0.05)",
                      }}
                    >
                      <Camera size={32} style={{ color: "var(--accent-blue)", marginBottom: "var(--space-md)" }} />
                      <span style={{ fontWeight: "600", marginBottom: "var(--space-sm)" }}>Klik atau drag untuk upload</span>
                      <span style={{ fontSize: "0.875rem", color: "var(--gray-400)" }}>
                        JPG, PNG, atau GIF (Max 5MB)
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        style={{ display: "none" }}
                      />
                    </label>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                  style={{ width: "100%", marginTop: "var(--space-lg)" }}
                >
                  {loading ? (
                    <>
                      <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />
                      Mengirim laporan...
                    </>
                  ) : (
                    <>
                      <Send size={18} />
                      Kirim Laporan
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Info Section */}
            <div style={{ marginTop: "var(--space-3xl)", padding: "var(--space-2xl)", backgroundColor: "rgba(59, 130, 246, 0.1)", borderRadius: "var(--radius-lg)", border: "1px solid var(--glass-border)" }}>
              <h4 style={{ marginBottom: "var(--space-md)" }}>Informasi Penting</h4>
              <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: "var(--space-sm)" }}>
                <li style={{ display: "flex", gap: "var(--space-md)" }}>
                  <CheckCircle2 size={20} style={{ color: "var(--accent-emerald)", flexShrink: 0 }} />
                  <span>Respon cepat dalam 2-4 jam kerja</span>
                </li>
                <li style={{ display: "flex", gap: "var(--space-md)" }}>
                  <CheckCircle2 size={20} style={{ color: "var(--accent-emerald)", flexShrink: 0 }} />
                  <span>Teknisi berstandar nasional</span>
                </li>
                <li style={{ display: "flex", gap: "var(--space-md)" }}>
                  <CheckCircle2 size={20} style={{ color: "var(--accent-emerald)", flexShrink: 0 }} />
                  <span>Garansi perbaikan 30 hari</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
