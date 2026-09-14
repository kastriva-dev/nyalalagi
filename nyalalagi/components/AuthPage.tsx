"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { LockKeyhole, Mail, UserPlus, LogIn, ArrowLeft, Loader2, ShieldCheck, KeyRound, Phone, Camera, LocateFixed } from "lucide-react";
import { createUserWithEmailAndPassword, onAuthStateChanged, sendPasswordResetEmail, signInWithEmailAndPassword } from "firebase/auth";
import { auth, db, firebaseReady } from "@/lib/firebase";
import { createCustomerProfile, getUserProfile } from "@/lib/user";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

export default function AuthPage() {
  const [mode, setMode] = useState<"login" | "register" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [province, setProvince] = useState("");
  const [city, setCity] = useState("");
  const [subdistrict, setSubdistrict] = useState("");
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [longlat, setLonglat] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const busyRef = useRef(false);
  const registrationFlowRef = useRef(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("mode") === "register") setMode("register");
    if (!auth) return;
    return onAuthStateChanged(auth, async (user) => {
      if (!user || user.isAnonymous || busyRef.current || registrationFlowRef.current) return;
      try {
        const profile = await getUserProfile(user.uid);
        window.location.href = profile?.role === "admin" ? "/admin" : "/laporan";
      } catch {
        window.location.href = "/laporan";
      }
    });
  }, []);

  function useCurrentLocation() {
    if (!navigator.geolocation) return setError("Browser Anda tidak mendukung lokasi GPS.");
    setError(""); setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => { setLonglat({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }); setLocationLoading(false); },
      () => { setError("Lokasi tidak dapat diambil. Anda tetap dapat mendaftar tanpa GPS."); setLocationLoading(false); },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 }
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setError(""); setMessage("");
    if (!firebaseReady || !auth) return setError("Firebase Authentication belum dikonfigurasi.");
    if (!email.trim()) return setError("Email wajib diisi.");
    if (mode !== "forgot" && password.length < 6) return setError("Password minimal 6 karakter.");
    try {
      setLoading(true);
      busyRef.current = true;
      if (mode === "register") {
        registrationFlowRef.current = true;
        if (!name.trim() || !phone.trim() || !address.trim() || !province.trim() || !city.trim() || !subdistrict.trim()) {
          throw new Error("Data nama, nomor WhatsApp, alamat, provinsi, kota dan kecamatan wajib diisi.");
        }
        const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
        await createCustomerProfile(credential.user, {
          name, phone_number: phone, address, province, city, subdistrict,
          profilce_picture: profilePicture, longlat
        });
        setMessage(`Akun ${name.trim() ? `untuk ${name.trim()} ` : ""}berhasil dibuat. Anda akan diarahkan ke laporan.`);
        // Registration is complete; keep the explicit redirect controlled by this flow.
        setTimeout(() => {
          registrationFlowRef.current = false;
          window.location.href = "/laporan";
        }, 700);
      } else if (mode === "login") {
        const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
        const profile = await getUserProfile(credential.user.uid);
        if (!profile) {
          await setDoc(doc(db!, "users", credential.user.uid), {
            name: credential.user.displayName || "",
            email: credential.user.email || email.trim(), phone_number: "", address: "", province: "", city: "", subdistrict: "",
            profilce_picture: "", role: "customer", fcm_token: "", balance: 0, longlat: null, status: "active",
            createdAt: serverTimestamp(), updatedAt: serverTimestamp()
          });
          window.location.href = "/laporan";
          return;
        }
        window.location.href = profile.role === "admin" ? "/admin" : "/laporan";
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
    } finally {
      setLoading(false);
      // Do not release the registration guard immediately: Firebase can emit
      // auth state changes asynchronously just after account creation.
      if (mode !== "register") registrationFlowRef.current = false;
      busyRef.current = false;
    }
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
        {mode === "register" && <>
          <div className="register-section-title">Data pelanggan</div>
          <div className="field"><label>Nama pelanggan *</label><input className="input" value={name} onChange={e=>setName(e.target.value)} placeholder="Nama lengkap" autoComplete="name"/></div>
          <div className="auth-form-grid"><div className="field"><label>Nomor WhatsApp *</label><div className="input-with-icon"><Phone size={17}/><input className="input" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="08xxxxxxxxxx" inputMode="tel"/></div></div><div className="field"><label>Foto profil</label><label className="file-input"><Camera size={17}/><span>{profilePicture?.name || "Pilih foto"}</span><input type="file" accept="image/*" onChange={e=>setProfilePicture(e.target.files?.[0] || null)}/></label></div></div>
          <div className="field"><label>Alamat *</label><textarea className="textarea" value={address} onChange={e=>setAddress(e.target.value)} placeholder="Alamat lengkap"/></div>
          <div className="auth-form-grid auth-form-grid-3"><div className="field"><label>Provinsi *</label><input className="input" value={province} onChange={e=>setProvince(e.target.value)} placeholder="Provinsi"/></div><div className="field"><label>Kota *</label><input className="input" value={city} onChange={e=>setCity(e.target.value)} placeholder="Kota"/></div><div className="field"><label>Kecamatan *</label><input className="input" value={subdistrict} onChange={e=>setSubdistrict(e.target.value)} placeholder="Kecamatan"/></div></div>
          <div className="location-register"><div><b>Koordinat lokasi</b><small>{longlat ? `${longlat.latitude.toFixed(6)}, ${longlat.longitude.toFixed(6)}` : "Opsional — membantu layanan berbasis lokasi."}</small></div><button type="button" className="btn btn-secondary" onClick={useCurrentLocation} disabled={locationLoading}><LocateFixed size={16}/>{locationLoading ? "Mengambil..." : "Gunakan GPS"}</button></div>
        </>}
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
