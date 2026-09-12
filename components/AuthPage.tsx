"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { LockKeyhole, Mail, UserPlus, LogIn, ArrowLeft, Loader2, ShieldCheck, KeyRound } from "lucide-react";
import { createUserWithEmailAndPassword, onAuthStateChanged, sendPasswordResetEmail, signInWithEmailAndPassword } from "firebase/auth";
import { auth, firebaseReady } from "@/lib/firebase";

export default function AuthPage() {
  const [mode, setMode] = useState<"login" | "register" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("mode") === "register") setMode("register");
    if (!auth) return;
    return onAuthStateChanged(auth, (user) => {
      if (user && !user.isAnonymous) window.location.href = "/laporan";
    });
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setError(""); setMessage("");
    if (!firebaseReady || !auth) return setError("Firebase Authentication belum dikonfigurasi.");
    if (!email.trim()) return setError("Email wajib diisi.");
    if (mode !== "forgot" && password.length < 6) return setError("Password minimal 6 karakter.");
    try {
      setLoading(true);
      if (mode === "register") {
        await createUserWithEmailAndPassword(auth, email.trim(), password);
        setMessage(`Akun ${name.trim() ? `untuk ${name.trim()} ` : ""}berhasil dibuat. Anda akan diarahkan ke laporan.`);
        setTimeout(() => { window.location.href = "/laporan"; }, 600);
      } else if (mode === "login") {
        await signInWithEmailAndPassword(auth, email.trim(), password);
        window.location.href = "/laporan";
      } else {
        await sendPasswordResetEmail(auth, email.trim());
        setMessage("Tautan reset password sudah dikirim ke email Anda. Periksa inbox dan folder spam.");
      }
    } catch (err: any) {
      const code = err?.code || "";
      const messages: Record<string,string> = {
        "auth/invalid-credential": "Email atau password salah.",
        "auth/user-not-found": "Akun dengan email tersebut belum terdaftar.",
        "auth/email-already-in-use": "Email tersebut sudah digunakan.",
        "auth/weak-password": "Password terlalu lemah. Gunakan minimal 6 karakter.",
        "auth/invalid-email": "Format email tidak valid.",
        "auth/too-many-requests": "Terlalu banyak percobaan. Silakan coba lagi beberapa saat lagi."
      };
      setError(messages[code] || err?.message || "Proses gagal. Silakan coba lagi.");
    } finally { setLoading(false); }
  }

  return <div className="auth-shell"><div className="auth-glow auth-glow-one"/><div className="auth-glow auth-glow-two"/>
    <div className="auth-card glass-card">
      <Link href="/" className="auth-back"><ArrowLeft size={16}/> Beranda</Link>
      <div className="auth-brand"><Image src="/company/logo.png" alt="NyalaLagi" width={58} height={58}/><div><b>NyalaLagi</b><span>Customer Portal</span></div></div>
      <div className="auth-heading">
        {mode === "login" && <><span className="eyebrow"><LockKeyhole size={15}/> Secure Login</span><h1>Masuk ke akun Anda</h1><p className="muted">Pantau laporan, buat permintaan layanan dan kelola akun pelanggan.</p></>}
        {mode === "register" && <><span className="eyebrow"><UserPlus size={15}/> Customer Registration</span><h1>Buat akun pelanggan</h1><p className="muted">Daftar sekali untuk mendapatkan pengalaman layanan NyalaLagi yang lebih terhubung.</p></>}
        {mode === "forgot" && <><span className="eyebrow"><KeyRound size={15}/> Password Recovery</span><h1>Lupa password?</h1><p className="muted">Masukkan email akun Anda dan kami akan mengirim tautan untuk membuat password baru.</p></>}
      </div>
      <form onSubmit={submit}>
        {mode === "register" && <div className="field"><label>Nama pelanggan</label><input className="input" value={name} onChange={e=>setName(e.target.value)} placeholder="Nama lengkap" autoComplete="name"/></div>}
        <div className="field"><label>Email</label><div className="input-with-icon"><Mail size={17}/><input className="input" value={email} onChange={e=>setEmail(e.target.value)} placeholder="nama@email.com" type="email" autoComplete="email" required/></div></div>
        {mode !== "forgot" && <div className="field"><label>Password</label><div className="input-with-icon"><LockKeyhole size={17}/><input className="input" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Minimal 6 karakter" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} required/></div></div>}
        {error && <div className="auth-alert error">{error}</div>}{message && <div className="auth-alert success">{message}</div>}
        <button className="btn btn-primary auth-submit" disabled={loading}>{loading ? <><Loader2 size={18} className="spin"/> Memproses...</> : mode === "login" ? <><LogIn size={18}/> Masuk</> : mode === "register" ? <><UserPlus size={18}/> Daftar Akun</> : <><KeyRound size={18}/> Kirim Link Reset</>}</button>
      </form>
      <div className="auth-links">
        {mode === "login" && <><button onClick={()=>setMode("forgot")}>Lupa password?</button><span>•</span><button onClick={()=>setMode("register")}>Belum punya akun? Daftar</button></>}
        {mode === "register" && <><span>Sudah punya akun?</span><button onClick={()=>setMode("login")}>Masuk</button></>}
        {mode === "forgot" && <><button onClick={()=>setMode("login")}>Kembali ke login</button></>}
      </div>
      <div className="security-note"><ShieldCheck size={18}/><div><b>Keamanan akun</b><span>Password diproses oleh Firebase Authentication dan disimpan dengan mekanisme keamanan server-side. Password tidak disimpan sebagai teks biasa di aplikasi.</span></div></div>
    </div>
  </div>;
}
