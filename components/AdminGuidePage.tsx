"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState, useEffect } from "react";
import {
  AlertCircle,
  Bell,
  BookOpen,
  Camera,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Download,
  FileText,
  Globe,
  HelpCircle,
  Home,
  LayoutDashboard,
  Lock,
  LogOut,
  MapPin,
  Menu,
  Monitor,
  Navigation,
  Pencil,
  Printer,
  RefreshCw,
  Search,
  Settings,
  ShieldCheck,
  Smartphone,
  Star,
  UserCog,
  UserRound,
  Users,
  WifiOff,
  Wrench,
  X
} from "lucide-react";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { getUserProfile } from "@/lib/user";

type GuideItem = {
  title: string;
  text: string;
  bullets?: string[];
  note?: string;
};

type GuideSection = {
  id: string;
  group: string;
  title: string;
  summary: string;
  icon: any;
  keywords: string[];
  items: GuideItem[];
};

const STATUS_FLOW = [
  ["SEARCHING_ENGINEER", "Mencari teknisi", "Laporan baru dibuat dan menunggu teknisi."],
  ["ENGINEER_ASSIGNED", "Teknisi ditugaskan", "Admin/sistem sudah menetapkan teknisi."],
  ["ENGINEER_ON_WAY", "Menuju lokasi", "Teknisi mulai perjalanan ke customer."],
  ["ARRIVED", "Teknisi tiba", "Teknisi sudah berada di lokasi pekerjaan."],
  ["IN_PROGRESS", "Pengerjaan", "Pekerjaan sedang dilakukan."],
  ["COMPLETED", "Selesai", "Teknisi menyelesaikan pekerjaan dan customer dapat mengonfirmasi/rating."]
];

const GUIDE_SECTIONS: GuideSection[] = [
  {
    id: "mulai",
    group: "Dasar",
    title: "Mulai & Hak Akses",
    summary: "Cara masuk, role pengguna, dan area yang bisa diakses setiap akun.",
    icon: ShieldCheck,
    keywords: ["login", "admin", "customer", "teknisi", "role", "akses", "akun"],
    items: [
      {
        title: "Login dan role akun",
        text: "NyalaLagi menggunakan Firebase Authentication. Setelah login, aplikasi membaca profil pengguna di Firestore untuk menentukan tampilan dan hak akses.",
        bullets: [
          "Admin: dashboard operasional, data customer, laporan, teknisi, CMS dan panduan.",
          "Customer: membuat laporan, melihat progres, menerima notifikasi, konfirmasi selesai dan memberi rating.",
          "Teknisi: menerima pekerjaan yang ditugaskan, memperbarui status, GPS, foto bukti dan penyelesaian pekerjaan."
        ]
      },
      {
        title: "Keluar dari akun",
        text: "Gunakan tombol Keluar pada kanan atas atau bagian bawah sidebar. Setelah logout, sesi Firebase berakhir dan pengguna dikembalikan ke halaman publik.",
        note: "Jangan berbagi akun admin. Buat akun terpisah untuk setiap operator bila nanti sistem dipakai oleh lebih dari satu orang."
      }
    ]
  },
  {
    id: "dashboard",
    group: "Admin",
    title: "Dashboard Operasional",
    summary: "Memantau statistik NyalaLagi tanpa mengambil seluruh data Firestore.",
    icon: LayoutDashboard,
    keywords: ["dashboard", "statistik", "customer", "laporan", "selesai", "grafik", "status", "refresh"],
    items: [
      {
        title: "Kartu statistik",
        text: "Empat kartu utama menampilkan total Customer, Teknisi, Laporan dan Selesai. Perhitungan menggunakan Firestore aggregation query sehingga lebih ringan saat data bertambah."
      },
      {
        title: "Laporan 7 Hari Terakhir",
        text: "Grafik memperlihatkan jumlah laporan masuk per hari untuk tujuh hari terakhir. Gunakan tombol Refresh bila ingin menarik angka terbaru tanpa memuat ulang seluruh halaman."
      },
      {
        title: "Status laporan",
        text: "Panel status menunjukkan beban kerja saat ini berdasarkan tahapan laporan: mencari teknisi, ditugaskan, menuju lokasi, pengerjaan, dan selesai."
      },
      {
        title: "Customer terbaru",
        text: "Dashboard menampilkan beberapa pendaftar customer terbaru sebagai ringkasan cepat. Untuk daftar lengkap, buka menu Customer."
      }
    ]
  },
  {
    id: "customer-admin",
    group: "Admin",
    title: "Manajemen Customer",
    summary: "Melihat akun customer, alamat, wilayah, status dan promosi role.",
    icon: Users,
    keywords: ["customer", "pelanggan", "cari email", "alamat", "whatsapp", "role", "promosi"],
    items: [
      {
        title: "Membuka data customer",
        text: "Pilih Customer pada sidebar admin. Data ditampilkan bertahap maksimal 20 item per query agar halaman tetap cepat walau jumlah akun besar.",
        bullets: ["Nama & email", "Nomor WhatsApp", "Alamat dan wilayah", "Status akun", "Role pengguna"]
      },
      {
        title: "Pencarian",
        text: "Gunakan kolom pencarian email. Pencarian dilakukan ke Firestore berdasarkan prefix email, bukan mengambil semua customer lalu memfilter di browser."
      },
      {
        title: "Jadikan teknisi",
        text: "Pada bagian aksi teknisi, admin dapat mempromosikan customer aktif menjadi role technician. Konfirmasi terlebih dahulu karena perubahan langsung tersimpan di Firestore.",
        note: "Pastikan data orang tersebut memang sudah diverifikasi sebelum mengubah role menjadi teknisi."
      }
    ]
  },
  {
    id: "laporan-admin",
    group: "Admin",
    title: "Manajemen Laporan",
    summary: "Melihat gangguan customer, status, lokasi dan menugaskan teknisi.",
    icon: ClipboardList,
    keywords: ["laporan", "gangguan", "assignment", "teknisi", "lokasi", "status", "nomor laporan"],
    items: [
      {
        title: "Daftar laporan",
        text: "Menu Laporan menampilkan nomor laporan, customer, jenis masalah, status, teknisi, lokasi dan waktu laporan dibuat. Pagination menjaga query tetap ringan."
      },
      {
        title: "Menugaskan teknisi",
        text: "Untuk laporan yang masih aktif, pilih teknisi pada dropdown. Sistem menyimpan technicianId, nama, nomor teknisi, waktu assignment dan mengubah status menjadi ENGINEER_ASSIGNED.",
        note: "Dropdown hanya memuat daftar teknisi aktif dalam batas query yang aman."
      },
      {
        title: "Status akhir",
        text: "Laporan berstatus COMPLETED, CANCELLED atau REJECTED tidak menampilkan pilihan assignment baru agar riwayat pekerjaan tetap konsisten."
      }
    ]
  },
  {
    id: "teknisi-admin",
    group: "Admin",
    title: "Manajemen Teknisi",
    summary: "Melihat teknisi, wilayah, status aktif dan performa rating.",
    icon: UserCog,
    keywords: ["teknisi", "rating", "wilayah", "status", "aktif", "ulasan"],
    items: [
      {
        title: "Data teknisi",
        text: "Menu Teknisi menampilkan identitas, WhatsApp, wilayah, rating rata-rata, jumlah ulasan dan status akun teknisi."
      },
      {
        title: "Rating teknisi",
        text: "Nilai rating berasal dari ulasan customer setelah pekerjaan selesai. Cloud Function memperbarui ratingCount, ratingSum dan ratingAverage pada profil teknisi."
      }
    ]
  },
  {
    id: "alur-customer",
    group: "Customer",
    title: "Alur Customer",
    summary: "Dari pendaftaran sampai laporan selesai dan memberikan ulasan.",
    icon: UserRound,
    keywords: ["customer", "daftar", "lapor", "gangguan", "lokasi", "rating", "konfirmasi"],
    items: [
      {
        title: "Daftar / login",
        text: "Customer membuat akun, melengkapi nama, WhatsApp, alamat, provinsi, kota/kabupaten, kecamatan dan lokasi bila tersedia."
      },
      {
        title: "Membuat laporan gangguan",
        text: "Buka Laporkan, isi jenis/keluhan, detail gangguan dan lokasi. Setelah tersimpan, laporan masuk ke status SEARCHING_ENGINEER."
      },
      {
        title: "Pantau progres",
        text: "Customer dapat membuka Laporan Saya untuk melihat status, teknisi yang ditugaskan, progres pekerjaan, lokasi teknisi yang tersedia, serta bukti pekerjaan."
      },
      {
        title: "Konfirmasi & rating",
        text: "Setelah teknisi menandai pekerjaan COMPLETED, customer dapat mengonfirmasi penyelesaian dan memberi rating 1–5 beserta komentar. Satu laporan hanya dapat memiliki satu ulasan."
      }
    ]
  },
  {
    id: "alur-teknisi",
    group: "Teknisi",
    title: "Alur Teknisi & GPS",
    summary: "Menangani pekerjaan, memperbarui status dan mengirim lokasi secara efisien.",
    icon: Navigation,
    keywords: ["teknisi", "gps", "tracking", "lokasi", "menuju", "tiba", "pengerjaan"],
    items: [
      {
        title: "Pekerjaan ditugaskan",
        text: "Teknisi melihat laporan yang technicianId-nya sesuai akun yang sedang login. Data customer dan lokasi dapat digunakan untuk menuju titik pekerjaan."
      },
      {
        title: "Tracking GPS",
        text: "Saat pekerjaan aktif, aplikasi dapat memperbarui lokasi teknisi ke reportTracking. Penulisan dibatasi berdasarkan waktu dan perubahan jarak agar tidak membebani Firestore secara berlebihan."
      },
      {
        title: "Perbarui status",
        text: "Ikuti urutan status operasional: ditugaskan → menuju lokasi → tiba → pengerjaan → selesai. Status ini juga menjadi dasar notifikasi kepada customer."
      }
    ]
  },
  {
    id: "status",
    group: "Operasional",
    title: "Alur Status Laporan",
    summary: "Arti setiap status utama agar admin dan teknisi tidak salah mengubah progres.",
    icon: RefreshCw,
    keywords: ["searching_engineer", "engineer_assigned", "on_way", "arrived", "in_progress", "completed", "status"],
    items: STATUS_FLOW.map(([code, label, explanation]) => ({
      title: `${label} — ${code}`,
      text: explanation
    }))
  },
  {
    id: "bukti-pekerjaan",
    group: "Operasional",
    title: "Bukti Pekerjaan",
    summary: "Foto sebelum/sesudah, penyelesaian teknisi, dan konfirmasi customer.",
    icon: Camera,
    keywords: ["foto", "before", "after", "bukti", "pekerjaan", "storage", "konfirmasi"],
    items: [
      {
        title: "Foto sebelum",
        text: "Teknisi dapat mengunggah bukti kondisi sebelum pekerjaan. URL gambar disimpan pada laporan agar customer/admin dapat melihat riwayatnya."
      },
      {
        title: "Foto sesudah",
        text: "Setelah perbaikan, teknisi mengunggah bukti sesudah pekerjaan sebelum menyelesaikan proses."
      },
      {
        title: "Konfirmasi customer",
        text: "Pekerjaan selesai dari sisi teknisi lebih dulu, lalu customer melakukan konfirmasi akhir dan rating. Mekanisme review menggunakan transaksi Firestore agar konfirmasi dan ulasan tetap konsisten."
      }
    ]
  },
  {
    id: "notifikasi",
    group: "Sistem",
    title: "Notifikasi FCM",
    summary: "Push notification perubahan status untuk customer.",
    icon: Bell,
    keywords: ["fcm", "notification", "notifikasi", "push", "token", "vapid", "izin"],
    items: [
      {
        title: "Aktifkan notifikasi",
        text: "Customer perlu memberikan izin notifikasi pada browser/perangkat. Setelah aktif, token FCM disimpan di profil pengguna."
      },
      {
        title: "Kapan notifikasi dikirim",
        text: "Cloud Functions mengirim pemberitahuan ketika laporan dibuat dan ketika status berubah, misalnya teknisi ditugaskan, menuju lokasi, tiba, pengerjaan dan selesai."
      },
      {
        title: "Jika notifikasi tidak masuk",
        text: "Periksa izin notifikasi browser, token FCM, konfigurasi VAPID, Cloud Messaging Firebase dan pastikan Functions sudah dideploy."
      }
    ]
  },
  {
    id: "landing-page",
    group: "Website",
    title: "Landing Page Publik",
    summary: "Bagian website yang dilihat calon customer sebelum login atau membuat laporan.",
    icon: Home,
    keywords: ["landing page", "hero", "tentang", "keunggulan", "layanan", "portfolio", "cara kerja", "testimonial", "teknisi", "faq", "cta", "footer"],
    items: [
      {
        title: "Struktur halaman",
        text: "Landing page menjelaskan layanan NyalaLagi dari atas ke bawah agar pengunjung langsung memahami fungsi website.",
        bullets: ["Hero & CTA laporan gangguan", "Tentang dan Keunggulan", "Layanan dan Portfolio", "Cara Kerja", "Teknisi Terpercaya", "Testimonial", "FAQ", "CTA akhir dan Footer"]
      },
      {
        title: "CTA laporan gangguan",
        text: "Tombol utama diarahkan ke alur laporan/login sehingga pengunjung tidak perlu mencari menu terlalu lama. Konten tombol dan teks dapat diubah dari CMS."
      },
      {
        title: "Navigasi mobile",
        text: "Website memiliki navigasi responsif untuk layar kecil. Setelah pengguna masuk, PWA juga menyediakan navigasi mobile ke Beranda, Laporkan, Laporan dan Akun sesuai konteks pengguna."
      }
    ]
  },
  {
    id: "cms",
    group: "Website",
    title: "CMS Website",
    summary: "Mengubah landing page tanpa mengedit source code.",
    icon: Pencil,
    keywords: ["cms", "edit website", "hero", "tentang", "layanan", "portfolio", "testimonial", "faq", "cta", "footer"],
    items: [
      {
        title: "Masuk ke mode CMS",
        text: "Dari sidebar admin pilih Edit Website. Landing page akan terbuka dalam mode admin. Klik Buka CMS Lengkap untuk mengedit semua bagian."
      },
      {
        title: "Bagian yang dapat diubah",
        text: "Admin dapat mengatur Hero, Tentang, Keunggulan, Layanan, Portfolio, Cara Kerja, Testimonial, Teknisi, FAQ, CTA, Footer dan SEO.",
        bullets: [
          "Teks/headline/subheadline dan tombol CTA",
          "Tambah, hapus dan susun item layanan/portfolio/cara kerja/testimonial/FAQ",
          "Upload/ganti gambar ke Firebase Storage folder CMS",
          "Kontak, link footer dan informasi website"
        ]
      },
      {
        title: "Menerbitkan perubahan",
        text: "Setelah selesai mengedit, klik Simpan Perubahan. Konten disimpan pada Firestore siteContent/main. Gambar yang baru diunggah belum dianggap final sampai perubahan CMS disimpan."
      }
    ]
  },
  {
    id: "seo",
    group: "Website",
    title: "SEO",
    summary: "Mengatur tampilan NyalaLagi di Google dan saat link dibagikan.",
    icon: Globe,
    keywords: ["seo", "google", "title", "description", "keywords", "canonical", "open graph", "robots"],
    items: [
      {
        title: "SEO Title & Description",
        text: "Isi judul yang menjelaskan layanan utama dan description yang singkat. Sebagai panduan, title sekitar 50–60 karakter dan description sekitar 140–160 karakter."
      },
      {
        title: "Canonical & Open Graph",
        text: "Canonical URL sebaiknya berisi domain utama NyalaLagi. Open Graph title/description/image digunakan saat link dibagikan ke WhatsApp, Facebook dan platform lain."
      },
      {
        title: "Robots",
        text: "Aktifkan index/follow pada website publik agar mesin pencari dapat mengindeks halaman. Jangan membuka indexing untuk halaman internal admin."
      },
      {
        title: "Setelah setting SEO",
        text: "Untuk optimasi lanjutan, daftarkan domain ke Google Search Console dan kirim sitemap bila tersedia. SEO membutuhkan waktu; perubahan metadata tidak menjamin langsung berada di peringkat teratas."
      }
    ]
  },
  {
    id: "pwa",
    group: "Sistem",
    title: "PWA & Instalasi",
    summary: "Install aplikasi, offline fallback, cache dan update versi.",
    icon: Smartphone,
    keywords: ["pwa", "install", "offline", "cache", "service worker", "update", "android", "iphone"],
    items: [
      {
        title: "Install di Android / desktop",
        text: "Saat browser mendukung instalasi, NyalaLagi menampilkan prompt Pasang. Setelah terpasang, aplikasi dapat dibuka dari layar utama seperti aplikasi biasa."
      },
      {
        title: "iPhone / iPad",
        text: "Gunakan menu Share pada Safari lalu pilih Add to Home Screen / Tambahkan ke Layar Utama. iOS tidak selalu menampilkan prompt instalasi otomatis seperti Android."
      },
      {
        title: "Mode offline & cache",
        text: "Static asset, icon dan image publik dicache sesuai strategi PWA. Halaman/data dinamis sensitif tidak sengaja disimpan sebagai salinan lama; saat jaringan putus aplikasi memakai offline fallback."
      },
      {
        title: "Splash, loading & navigasi mobile",
        text: "Saat aplikasi dibuka, NyalaLagi menampilkan loading/splash agar perpindahan terasa lebih rapi. Di layar mobile tersedia navigasi ringkas ke fitur utama dan indikator saat koneksi sedang offline."
      },
      {
        title: "Update aplikasi",
        text: "Setiap deployment membuat versi service worker baru. Ketika versi baru terdeteksi, pengguna dapat memilih Perbarui agar cache lama diganti dan aplikasi memuat versi terbaru."
      }
    ]
  },
  {
    id: "keamanan",
    group: "Sistem",
    title: "Keamanan & Data",
    summary: "Aturan role, Firestore Rules dan Storage Rules yang harus dijaga.",
    icon: Lock,
    keywords: ["security", "rules", "firestore", "storage", "admin", "akses", "keamanan"],
    items: [
      {
        title: "Firestore Rules",
        text: "Akses data dibatasi berdasarkan authentication dan role. Customer tidak boleh mengubah role/balance sendiri, teknisi hanya menangani laporan yang ditugaskan, dan admin memiliki hak operasional yang lebih luas."
      },
      {
        title: "Storage Rules",
        text: "File profil, bukti pekerjaan dan gambar CMS memiliki aturan berbeda. Folder CMS dapat dibaca publik untuk landing page, tetapi perubahan file CMS hanya diperbolehkan untuk admin."
      },
      {
        title: "Environment variable",
        text: "Firebase config dan VAPID key harus disimpan di environment Vercel, bukan menaruh credential server rahasia di source code publik.",
        note: "Jangan menonaktifkan Rules hanya untuk mengatasi error izin. Perbaiki rule atau alur data sesuai kebutuhan."
      }
    ]
  },
  {
    id: "troubleshooting",
    group: "Bantuan",
    title: "Troubleshooting Cepat",
    summary: "Langkah awal ketika data, PWA, notifikasi atau deployment bermasalah.",
    icon: HelpCircle,
    keywords: ["error", "gagal", "vercel", "build", "firestore", "index", "pwa", "notifikasi", "cache"],
    items: [
      {
        title: "Vercel build gagal",
        text: "Baca bagian paling bawah log dan cari baris pertama Type error / Build error. Peringatan npm audit tidak otomatis berarti build gagal."
      },
      {
        title: "Firestore meminta index",
        text: "Jika query membutuhkan composite index, Firebase biasanya memberikan link pembuatan index pada pesan error. Buat index tersebut dan tunggu sampai status Ready."
      },
      {
        title: "Perubahan website belum terlihat",
        text: "Pastikan CMS sudah disimpan. Jika source baru sudah dideploy tetapi browser masih menampilkan versi lama, gunakan notifikasi update PWA atau refresh setelah service worker baru aktif."
      },
      {
        title: "Aplikasi offline",
        text: "Indikator offline menunjukkan jaringan tidak tersedia. Data real-time membutuhkan internet; fallback offline hanya menjaga app shell dan halaman fallback tetap dapat dibuka."
      },
      {
        title: "Notifikasi tidak muncul",
        text: "Periksa izin browser, token FCM, VAPID key, deploy Functions dan dukungan push notification pada browser/perangkat."
      }
    ]
  }
];

export default function AdminGuidePage() {
  const [me, setMe] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeGroup, setActiveGroup] = useState("Semua");

  useEffect(() => {
    if (!auth) {
      setError("Firebase belum dikonfigurasi.");
      setChecking(false);
      return;
    }
    return onAuthStateChanged(auth, async (user) => {
      if (!user || user.isAnonymous) {
        window.location.href = "/login";
        return;
      }
      try {
        const profile = await getUserProfile(user.uid);
        if (profile?.role !== "admin") {
          window.location.href = "/laporan";
          return;
        }
        setMe(user);
      } catch {
        setError("Profil admin tidak dapat diverifikasi.");
      } finally {
        setChecking(false);
      }
    });
  }, []);

  const groups = useMemo(() => ["Semua", ...Array.from(new Set(GUIDE_SECTIONS.map((s) => s.group)))], []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return GUIDE_SECTIONS.filter((section) => {
      const groupMatch = activeGroup === "Semua" || section.group === activeGroup;
      if (!groupMatch) return false;
      if (!q) return true;
      const haystack = [
        section.title,
        section.summary,
        section.group,
        ...section.keywords,
        ...section.items.flatMap((item) => [item.title, item.text, ...(item.bullets || []), item.note || ""])
      ].join(" ").toLowerCase();
      return haystack.includes(q);
    });
  }, [query, activeGroup]);

  async function logout() {
    if (auth) await signOut(auth);
    window.location.href = "/";
  }

  if (checking) {
    return <div className="admin-loading"><div className="admin-loader"/><b>Memverifikasi akses admin...</b></div>;
  }

  return <div className="admin-shell admin-guide-shell">
    <aside className={`admin-sidebar ${mobileOpen ? "open" : ""}`}>
      <div className="admin-logo"><Image src="/company/logo.png" alt="NyalaLagi" width={38} height={38}/><div><b>NyalaLagi</b><span>Operational Console</span></div></div>
      <div className="admin-user"><div className="admin-avatar"><ShieldCheck size={19}/></div><div><b>{me?.email || "Administrator"}</b><span>Administrator</span></div></div>
      <nav className="admin-menu admin-guide-menu">
        <Link href="/admin"><LayoutDashboard size={18}/> Dashboard</Link>
        <Link href="/admin?tab=customers"><Users size={18}/> Customer</Link>
        <Link href="/admin?tab=reports"><ClipboardList size={18}/> Laporan</Link>
        <Link href="/admin?tab=technicians"><UserCog size={18}/> Teknisi</Link>
        <Link href="/admin/panduan" className="active"><BookOpen size={18}/> Panduan</Link>
        <Link href="/?adminEdit=1"><Pencil size={18}/> Edit Website <span>CMS</span></Link>
      </nav>
      <div className="admin-sidebar-bottom"><Link href="/"><Home size={17}/> Lihat Landing Page</Link><button onClick={logout}><LogOut size={17}/> Keluar</button></div>
    </aside>

    {mobileOpen && <button className="admin-overlay" aria-label="Tutup menu" onClick={() => setMobileOpen(false)}/>} 

    <main className="admin-main">
      <header className="admin-topbar">
        <button className="admin-menu-toggle" onClick={() => setMobileOpen(true)}><Menu size={22}/></button>
        <div><span className="admin-kicker">ADMINISTRATOR · TAHAP 11</span><h1>Panduan NyalaLagi</h1></div>
        <div className="admin-top-actions">
          <Link className="admin-guide-link active" href="/admin/panduan"><BookOpen size={16}/> Panduan</Link>
          <button className="admin-guide-print" onClick={() => window.print()} title="Cetak panduan"><Printer size={16}/><span>Cetak</span></button>
          <Link className="admin-logout admin-dashboard-link" href="/admin"><LayoutDashboard size={16}/> Dashboard</Link>
          <button className="admin-logout" onClick={logout}><LogOut size={16}/> Keluar</button>
        </div>
      </header>

      {error && <div className="admin-error">{error}<button onClick={() => setError("")}><X size={14}/></button></div>}

      <section className="guide-hero">
        <div className="guide-hero-copy">
          <span className="guide-eyebrow"><BookOpen size={15}/> Pusat Bantuan Admin</span>
          <h2>Panduan lengkap seluruh fitur NyalaLagi</h2>
          <p>Gunakan halaman ini sebagai SOP singkat untuk admin, customer, teknisi, CMS, SEO, PWA, notifikasi dan alur penyelesaian laporan.</p>
          <div className="guide-search"><Search size={19}/><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari: CMS, laporan, teknisi, PWA, notifikasi..."/>{query && <button onClick={() => setQuery("")} aria-label="Hapus pencarian"><X size={16}/></button>}</div>
        </div>
        <div className="guide-hero-card">
          <div><Monitor size={23}/><span>Admin</span><strong>Operasional & CMS</strong></div>
          <div><UserRound size={23}/><span>Customer</span><strong>Laporan & Rating</strong></div>
          <div><Wrench size={23}/><span>Teknisi</span><strong>GPS & Pekerjaan</strong></div>
          <div><Smartphone size={23}/><span>PWA</span><strong>Install & Offline</strong></div>
        </div>
      </section>

      <section className="guide-quick-grid">
        <a href="#laporan-admin"><ClipboardList size={20}/><div><b>Kelola laporan</b><span>Assignment & status</span></div><ChevronRight size={16}/></a>
        <a href="#cms"><Pencil size={20}/><div><b>Edit website</b><span>CMS tanpa coding</span></div><ChevronRight size={16}/></a>
        <a href="#seo"><Globe size={20}/><div><b>Atur SEO</b><span>Google & share link</span></div><ChevronRight size={16}/></a>
        <a href="#pwa"><Download size={20}/><div><b>Pasang PWA</b><span>Install & update</span></div><ChevronRight size={16}/></a>
      </section>

      <section className="guide-status-card" id="status-ringkas">
        <div className="guide-section-heading"><div><span>ALUR UTAMA</span><h3>Siklus laporan</h3></div><p>Gunakan urutan ini agar status customer dan teknisi tetap sinkron.</p></div>
        <div className="guide-status-flow">
          {STATUS_FLOW.map(([code, label], index) => <div className="guide-status-step" key={code}><span>{index + 1}</span><div><b>{label}</b><small>{code}</small></div>{index < STATUS_FLOW.length - 1 && <ChevronRight size={16}/>}</div>)}
        </div>
      </section>

      <section className="guide-filter-bar">
        <div className="guide-filter-scroll">
          {groups.map((group) => <button key={group} className={activeGroup === group ? "active" : ""} onClick={() => setActiveGroup(group)}>{group}</button>)}
        </div>
        <span>{filtered.length} topik</span>
      </section>

      <section className="guide-layout">
        <aside className="guide-toc">
          <div className="guide-toc-title"><FileText size={16}/><b>Daftar isi</b></div>
          {filtered.map((section) => { const TocIcon = section.icon; return <a key={section.id} href={`#${section.id}`}><TocIcon size={15}/><span>{section.title}</span></a>; })}
          {!filtered.length && <small>Tidak ada topik yang cocok.</small>}
        </aside>

        <div className="guide-content">
          {filtered.map((section, sectionIndex) => {
            const Icon = section.icon;
            return <article className="guide-article" id={section.id} key={section.id}>
              <header className="guide-article-head">
                <div className="guide-article-icon"><Icon size={22}/></div>
                <div><span>{section.group} · {String(sectionIndex + 1).padStart(2, "0")}</span><h3>{section.title}</h3><p>{section.summary}</p></div>
              </header>
              <div className="guide-item-list">
                {section.items.map((item, i) => <div className="guide-item" key={`${section.id}-${i}`}>
                  <div className="guide-item-number">{i + 1}</div>
                  <div className="guide-item-body"><h4>{item.title}</h4><p>{item.text}</p>
                    {item.bullets && <ul>{item.bullets.map((bullet) => <li key={bullet}><CheckCircle2 size={14}/><span>{bullet}</span></li>)}</ul>}
                    {item.note && <div className="guide-note"><AlertCircle size={15}/><span>{item.note}</span></div>}
                  </div>
                </div>)}
              </div>
            </article>;
          })}
          {!filtered.length && <div className="guide-empty"><Search size={34}/><h3>Panduan tidak ditemukan</h3><p>Coba kata kunci lain atau pilih kategori Semua.</p><button onClick={() => { setQuery(""); setActiveGroup("Semua"); }}>Reset pencarian</button></div>}
        </div>
      </section>

      <section className="guide-footer-help">
        <div><HelpCircle size={24}/><div><b>Tips penggunaan</b><p>Gunakan kolom pencarian di atas untuk menemukan SOP lebih cepat. Panduan ini hanya bisa dibuka oleh akun dengan role admin.</p></div></div>
        <Link href="/admin">Kembali ke Dashboard <ChevronRight size={16}/></Link>
      </section>
    </main>
  </div>;
}
