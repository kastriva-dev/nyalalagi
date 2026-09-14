import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { db, storage } from "./firebase";

export type CMSService = { title: string; text: string; image: string };
export type CMSPortfolio = { title: string; category: string; image: string };
export type CMSTestimonial = { text: string; name: string; role: string; rating: number };
export type CMSProcessItem = { title: string; text: string };
export type CMSFAQItem = { question: string; answer: string };
export type CMSLink = { label: string; href: string };

export type SiteContent = {
  hero: {
    eyebrow: string;
    title: string;
    highlight: string;
    description: string;
    image: string;
    primaryButtonLabel: string;
    secondaryButtonLabel: string;
    trustItems: string[];
  };
  about: {
    eyebrow: string;
    title: string;
    text1: string;
    text2: string;
    image: string;
    promiseLabel: string;
    promiseTitle: string;
    points: string[];
  };
  advantages: {
    eyebrow: string;
    title: string;
    description: string;
    items: { title: string; text: string }[];
  };
  services: {
    eyebrow: string;
    title: string;
    description: string;
    buttonLabel: string;
    items: CMSService[];
  };
  portfolio: {
    eyebrow: string;
    title: string;
    description: string;
    items: CMSPortfolio[];
  };
  process: {
    eyebrow: string;
    title: string;
    description: string;
    items: CMSProcessItem[];
  };
  testimonial: {
    eyebrow: string;
    title: string;
    description: string;
    rating: string;
    ratingLabel: string;
    items: CMSTestimonial[];
  };
  technicians: {
    eyebrow: string;
    title: string;
    description: string;
    points: string[];
    buttonLabel: string;
    statusLabel: string;
    cardTitle: string;
    cardText: string;
    cardSteps: string[];
  };
  faq: {
    eyebrow: string;
    title: string;
    description: string;
    items: CMSFAQItem[];
  };
  cta: {
    eyebrow: string;
    title: string;
    text: string;
    primaryButtonLabel: string;
    secondaryButtonLabel: string;
  };
  footer: {
    brand: string;
    description: string;
    address: string;
    phone: string;
    email: string;
    webLinksTitle: string;
    serviceLinksTitle: string;
    webLinks: CMSLink[];
    serviceLinks: CMSLink[];
    newsletterTitle: string;
    newsletterText: string;
    newsletterButtonLabel: string;
    copyright: string;
    social: { twitter: string; facebook: string; instagram: string; linkedin: string };
  };
  seo: {
    title: string;
    description: string;
    keywords: string;
    canonicalUrl: string;
    ogTitle: string;
    ogDescription: string;
    ogImage: string;
    robotsIndex: boolean;
    robotsFollow: boolean;
  };
  // Existing sections from earlier stages are retained so upgrades do not remove content.
  partner: { eyebrow: string; title: string; text: string; benefits: { title: string; text: string }[] };
  vision: { eyebrow: string; title: string; visionTitle: string; visionText: string; missionTitle: string; missionText: string };
};

export const DEFAULT_SITE_CONTENT: SiteContent = {
  hero: {
    eyebrow: "Mudah, Cepat, Berkualitas, Andalan",
    title: "Masalah listrik?",
    highlight: "NyalaLagi yang urus.",
    description: "NyalaLagi adalah platform digital di bawah naungan PT Nyalalagi Solusi Andalan yang menghubungkan masyarakat dengan tenaga ahli kelistrikan melalui layanan yang mudah, cepat, berkualitas dan menjadi andalan.",
    image: "/company/hero-1.jpg",
    primaryButtonLabel: "Laporan via Website",
    secondaryButtonLabel: "Laporan via WhatsApp",
    trustItems: ["Teknisi terdaftar", "Berbasis lokasi", "Layanan aman"]
  },
  about: {
    eyebrow: "Tentang",
    title: "Nyalalagi apa sihhh ???",
    text1: "Nyalalagi adalah platform digital yang menyediakan jasa perbaikan kelistrikan rumah Anda dengan cara yang MUDAH, penyelesaian CEPAT, hasil yang BERKUALITAS dan service yang menjadi ANDALAN.",
    text2: "Dengan kombinasi antara teknologi digital yang canggih dan didukung tenaga ahli kelistrikan yang mumpuni, kami bertujuan menjadi penyedia jasa perbaikan listrik yang terkemuka di pasar dan menjadi andalan masyarakat.",
    image: "/company/nyala-about.jpg",
    promiseLabel: "OUR PROMISE",
    promiseTitle: "Solusi kelistrikan yang terasa sederhana bagi pelanggan.",
    points: ["Proses digital", "Tenaga ahli", "Hasil berkualitas"]
  },
  advantages: {
    eyebrow: "Keunggulan",
    title: "MUDAH, CEPAT, BERKUALITAS & ANDALAN",
    description: "Empat nilai utama yang menjadi standar layanan NyalaLagi.",
    items: [
      { title: "MUDAH", text: "Layanan berbasis teknologi digital membuat pelanggan lebih mudah mendapatkan service kelistrikan dalam satu genggaman." },
      { title: "CEPAT", text: "Proses laporan dan pencarian teknisi berbasis lokasi membantu mempercepat penanganan problem kelistrikan." },
      { title: "BERKUALITAS", text: "Didukung tenaga ahli kelistrikan yang mumpuni untuk memberikan hasil pekerjaan yang rapi, aman dan berkualitas." },
      { title: "ANDALAN", text: "Kemudahan, kecepatan dan kualitas menjadi komitmen NyalaLagi untuk menjadi penyedia teknisi listrik andalan masyarakat." }
    ]
  },
  services: {
    eyebrow: "Layanan",
    title: "Layanan kelistrikan untuk kebutuhan rumah hingga proyek.",
    description: "Pilih kebutuhan Anda dan buat laporan langsung melalui NyalaLagi.",
    buttonLabel: "Konsultasikan",
    items: [
      { title: "Perbaikan Alat Instalasi Listrik", text: "Dengan dukungan teknisi listrik yang sangat berpengalaman, kami siap menyelesaikan semua kerusakan peralatan instalasi kelistrikan rumah Anda dengan hasil terbaik dan aman.", image: "/company/nyala-service-1.jpg" },
      { title: "Instalasi Listrik Baru", text: "Kami menyediakan instalasi pemasangan listrik baru untuk perumahan, gedung, perkantoran, pabrik dan tempat usaha lainnya dengan standar keamanan dan keselamatan yang tinggi, instalasi rapi dan berkualitas.", image: "/company/nyala-service-2.jpg" },
      { title: "Instalasi PJU & Maintenance", text: "Layanan instalasi dan maintenance Penerangan Jalan Umum (PJU) untuk menjaga pencahayaan tetap aman, efektif dan siap digunakan.", image: "/company/nyala-service-3.jpg" },
      { title: "Instalasi Penangkal Petir Rumah & Gedung", text: "Pemasangan sistem penangkal petir dengan perhatian pada grounding, material berkualitas dan standar keselamatan untuk rumah maupun gedung.", image: "/company/nyala-service-4.jpg" }
    ]
  },
  portfolio: {
    eyebrow: "Portfolio",
    title: "Portfolio semua layanan",
    description: "Contoh area pekerjaan yang dapat ditangani oleh tim dan mitra teknisi NyalaLagi.",
    items: [
      { title: "Perbaikan Instalasi Rumah", category: "Perbaikan", image: "/company/nyala-portfolio-1.jpg" },
      { title: "Instalasi Listrik Baru", category: "Instalasi", image: "/company/hero-2.jpg" },
      { title: "PJU & Maintenance", category: "PJU", image: "/company/hero-3.jpg" },
      { title: "Penangkal Petir", category: "Proteksi", image: "/company/hero-4.jpg" },
      { title: "Perbaikan Gangguan Listrik", category: "Perbaikan", image: "/company/service-gangguan.jpg" },
      { title: "Instalasi & Proteksi Kelistrikan", category: "Kelistrikan", image: "/company/service-petir.jpg" }
    ]
  },
  process: {
    eyebrow: "Cara Kerja",
    title: "Dari laporan sampai selesai, semuanya lebih terarah.",
    description: "NyalaLagi membantu mempertemukan kebutuhan Anda dengan teknisi yang sesuai lokasi dan layanan.",
    items: [
      { title: "Buat laporan", text: "Ceritakan gangguan listrik, tambahkan foto dan lokasi pekerjaan." },
      { title: "Cari teknisi", text: "Sistem membantu mencari mitra teknisi yang tersedia berdasarkan lokasi." },
      { title: "Teknisi menangani", text: "Teknisi datang, memeriksa masalah dan mengerjakan perbaikan." },
      { title: "Selesai & beri rating", text: "Konfirmasi pekerjaan, lalu berikan penilaian untuk pengalaman Anda." }
    ]
  },
  testimonial: {
    eyebrow: "Testimonial",
    title: "Dipercaya pelanggan, dinilai dari pengalaman.",
    description: "Pengalaman pelanggan menjadi bagian penting dari kualitas layanan NyalaLagi.",
    rating: "5.0",
    ratingLabel: "Rating pelanggan",
    items: [
      { text: "Pelayanan cepat dan teknisinya komunikatif. Proses laporan juga terasa mudah.", name: "Pelanggan NyalaLagi", role: "Pelanggan", rating: 5 },
      { text: "Pekerjaan instalasinya rapi dan teknisi menjelaskan kondisi listrik dengan jelas.", name: "Pelanggan NyalaLagi", role: "Pelanggan", rating: 5 },
      { text: "Sangat membantu ketika ada gangguan listrik. Laporan bisa dibuat tanpa proses yang rumit.", name: "Pelanggan NyalaLagi", role: "Pelanggan", rating: 5 }
    ]
  },
  technicians: {
    eyebrow: "Teknisi Terpercaya",
    title: "Teknisi terdaftar. Proses lebih transparan.",
    description: "Kami membangun ekosistem mitra teknisi dengan profil, status pekerjaan, pelacakan lokasi, bukti pekerjaan dan rating pelanggan.",
    points: ["Mitra terdaftar", "Berbasis lokasi", "Update status pekerjaan", "Rating pelanggan"],
    buttonLabel: "Cari bantuan sekarang",
    statusLabel: "MITRA AKTIF",
    cardTitle: "Teknisi NyalaLagi",
    cardText: "Siap membantu kebutuhan kelistrikan Anda.",
    cardSteps: ["Daftar", "Kerjakan", "Selesai"]
  },
  faq: {
    eyebrow: "FAQ",
    title: "Pertanyaan yang sering ditanyakan.",
    description: "Masih ragu? Berikut jawaban singkat sebelum Anda membuat laporan.",
    items: [
      { question: "Bagaimana cara membuat laporan?", answer: "Klik tombol Buat Laporan, masuk atau daftar, lalu isi detail gangguan, lokasi dan foto kondisi listrik." },
      { question: "Apakah teknisi dipilih berdasarkan lokasi?", answer: "Ya. Sistem NyalaLagi dirancang untuk membantu pencarian mitra teknisi berdasarkan lokasi dan ketersediaan." },
      { question: "Apakah saya bisa memantau proses pekerjaan?", answer: "Ya. Setelah teknisi ditugaskan, status pekerjaan dapat diperbarui dan pelanggan dapat melihat informasi perjalanan teknisi pada laporan." },
      { question: "Bagaimana setelah pekerjaan selesai?", answer: "Pelanggan dapat melihat bukti pekerjaan, mengonfirmasi penyelesaian dan memberikan rating serta ulasan." },
      { question: "Apakah saya harus menghubungi WhatsApp?", answer: "Tidak wajib. Anda dapat membuat laporan langsung melalui website. WhatsApp tersedia sebagai jalur bantuan tambahan." }
    ]
  },
  cta: {
    eyebrow: "Butuh bantuan?",
    title: "Masalah listrik? NyalaLagi yang urus.",
    text: "Buat laporan melalui website atau hubungi NyalaLagi langsung melalui WhatsApp.",
    primaryButtonLabel: "Buat Laporan",
    secondaryButtonLabel: "WhatsApp"
  },
  footer: {
    brand: "NyalaLagi",
    description: "Solusi digital untuk layanan dan teknisi kelistrikan yang mudah, cepat, berkualitas dan andalan.",
    address: "Bandung Technopark Gedung C\nJl Komunikasi No 1, Sukapura Kabupaten Bandung",
    phone: "+62 851-9591-2262",
    email: "cs@nyalalagi.com",
    webLinksTitle: "Tautan Web",
    serviceLinksTitle: "Produk Layanan",
    webLinks: [
      { label: "Beranda", href: "#" },
      { label: "Tentang", href: "#tentang" },
      { label: "Cara Kerja", href: "#cara-kerja" },
      { label: "Layanan", href: "#layanan" },
      { label: "Teknisi", href: "#teknisi" },
      { label: "FAQ", href: "#faq" }
    ],
    serviceLinks: [
      { label: "Perbaikan Instalasi", href: "#layanan" },
      { label: "Instalasi Listrik Baru", href: "#layanan" },
      { label: "Penerangan Jalan Umum", href: "#layanan" },
      { label: "Penangkal Petir", href: "#layanan" }
    ],
    newsletterTitle: "Our Newsletter",
    newsletterText: "Subscribe to our newsletter and receive the latest news about our products and services!",
    newsletterButtonLabel: "Subscribe",
    copyright: "PT Nyalalagi Solusi Andalan. All rights reserved.",
    social: { twitter: "", facebook: "", instagram: "", linkedin: "" }
  },
  seo: {
    title: "NyalaLagi — Layanan Perbaikan Kelistrikan",
    description: "NyalaLagi adalah platform digital PT Nyalalagi Solusi Andalan yang mempertemukan masyarakat dengan teknisi listrik.",
    keywords: "teknisi listrik, perbaikan listrik, instalasi listrik, NyalaLagi, jasa listrik",
    canonicalUrl: "",
    ogTitle: "NyalaLagi — Masalah listrik? NyalaLagi yang urus.",
    ogDescription: "Layanan kelistrikan digital dengan teknisi terdaftar, pelacakan status, bukti pekerjaan dan rating pelanggan.",
    ogImage: "/company/hero-1.jpg",
    robotsIndex: true,
    robotsFollow: true
  },
  partner: {
    eyebrow: "Mitra Teknisi",
    title: "Benefit gabung mitra teknisi NyalaLagi",
    text: "Bergabung sebagai mitra teknisi dan jadilah bagian dari ekosistem layanan kelistrikan digital yang profesional.",
    benefits: [
      { title: "Peluang pekerjaan", text: "Dapatkan peluang pekerjaan kelistrikan dari pelanggan NyalaLagi." },
      { title: "Jangkauan lebih luas", text: "Perluas area layanan dan temukan pelanggan sesuai lokasi Anda." },
      { title: "Profil profesional", text: "Bangun reputasi sebagai mitra teknisi yang profesional dan terpercaya." },
      { title: "Teknologi terintegrasi", text: "Gunakan sistem digital untuk menerima dan mengelola permintaan layanan." }
    ]
  },
  vision: {
    eyebrow: "Visi & Misi",
    title: "Menjadi penyedia jasa teknisi listrik paling terpercaya.",
    visionTitle: "Visi Kami",
    visionText: "Menjadi perusahaan penyedia jasa teknisi listrik paling terpercaya untuk memastikan keamanan, kenyamanan pelanggan dan menjadi andalan masyarakat umum maupun dunia usaha.",
    missionTitle: "Misi Kami",
    missionText: "Memberikan layanan instalasi & perbaikan alat kelistrikan yang mudah, cepat, berkualitas & andalan; menghadirkan mitra teknisi yang berkompeten dan profesional melalui pelatihan berkelanjutan serta mendukung pemanfaatan inovasi teknologi digital."
  }
};

function arrayOr<T>(value: unknown, fallback: T[]): T[] {
  return Array.isArray(value) ? (value as T[]) : fallback;
}

export function mergeContent(raw: unknown): SiteContent {
  const r = (raw && typeof raw === "object" ? raw : {}) as any;
  const legacyHero = r.hero?.title === "NyalaLagi" && r.hero?.highlight === "Penyedia Teknisi Listrik Andalan Anda";
  const rawAdvantages = Array.isArray(r.advantages) ? { items: r.advantages } : (r.advantages || {});
  const rawServices = Array.isArray(r.services) ? { items: r.services } : (r.services || {});
  const rawPortfolio = Array.isArray(r.portfolio) ? { items: r.portfolio } : (r.portfolio || {});

  const serviceItems = arrayOr<CMSService>(rawServices.items, DEFAULT_SITE_CONTENT.services.items).map((item, i) => ({
    ...DEFAULT_SITE_CONTENT.services.items[i % DEFAULT_SITE_CONTENT.services.items.length],
    ...item
  }));
  const portfolioItems = arrayOr<any>(rawPortfolio.items, DEFAULT_SITE_CONTENT.portfolio.items).map((item, i) => ({
    ...DEFAULT_SITE_CONTENT.portfolio.items[i % DEFAULT_SITE_CONTENT.portfolio.items.length],
    ...item,
    category: item?.category || "NyalaLagi"
  }));
  const testimonialItems = arrayOr<any>(r.testimonial?.items, DEFAULT_SITE_CONTENT.testimonial.items).map((item, i) => ({
    ...DEFAULT_SITE_CONTENT.testimonial.items[i % DEFAULT_SITE_CONTENT.testimonial.items.length],
    ...item,
    role: item?.role || "Pelanggan"
  }));

  return {
    hero: {
      ...DEFAULT_SITE_CONTENT.hero,
      ...(r.hero || {}),
      ...(legacyHero ? { title: DEFAULT_SITE_CONTENT.hero.title, highlight: DEFAULT_SITE_CONTENT.hero.highlight } : {}),
      trustItems: arrayOr<string>(r.hero?.trustItems, DEFAULT_SITE_CONTENT.hero.trustItems)
    },
    about: {
      ...DEFAULT_SITE_CONTENT.about,
      ...(r.about || {}),
      points: arrayOr<string>(r.about?.points, DEFAULT_SITE_CONTENT.about.points)
    },
    advantages: {
      ...DEFAULT_SITE_CONTENT.advantages,
      ...rawAdvantages,
      items: arrayOr(rawAdvantages.items, DEFAULT_SITE_CONTENT.advantages.items)
    },
    services: {
      ...DEFAULT_SITE_CONTENT.services,
      ...rawServices,
      items: serviceItems
    },
    portfolio: {
      ...DEFAULT_SITE_CONTENT.portfolio,
      ...rawPortfolio,
      items: portfolioItems
    },
    process: {
      ...DEFAULT_SITE_CONTENT.process,
      ...(r.process || {}),
      items: arrayOr(r.process?.items, DEFAULT_SITE_CONTENT.process.items)
    },
    testimonial: {
      ...DEFAULT_SITE_CONTENT.testimonial,
      ...(r.testimonial || {}),
      items: testimonialItems
    },
    technicians: {
      ...DEFAULT_SITE_CONTENT.technicians,
      ...(r.technicians || {}),
      points: arrayOr(r.technicians?.points, DEFAULT_SITE_CONTENT.technicians.points),
      cardSteps: arrayOr(r.technicians?.cardSteps, DEFAULT_SITE_CONTENT.technicians.cardSteps)
    },
    faq: {
      ...DEFAULT_SITE_CONTENT.faq,
      ...(r.faq || {}),
      items: arrayOr(r.faq?.items, DEFAULT_SITE_CONTENT.faq.items)
    },
    cta: { ...DEFAULT_SITE_CONTENT.cta, ...(r.cta || {}) },
    footer: {
      ...DEFAULT_SITE_CONTENT.footer,
      ...(r.footer || {}),
      webLinks: arrayOr(r.footer?.webLinks, DEFAULT_SITE_CONTENT.footer.webLinks),
      serviceLinks: arrayOr(r.footer?.serviceLinks, DEFAULT_SITE_CONTENT.footer.serviceLinks),
      social: { ...DEFAULT_SITE_CONTENT.footer.social, ...(r.footer?.social || {}) }
    },
    seo: { ...DEFAULT_SITE_CONTENT.seo, ...(r.seo || {}) },
    partner: {
      ...DEFAULT_SITE_CONTENT.partner,
      ...(r.partner || {}),
      benefits: arrayOr(r.partner?.benefits, DEFAULT_SITE_CONTENT.partner.benefits)
    },
    vision: { ...DEFAULT_SITE_CONTENT.vision, ...(r.vision || {}) }
  };
}

export async function getSiteContent(): Promise<SiteContent> {
  if (!db) return DEFAULT_SITE_CONTENT;
  const snap = await getDoc(doc(db, "siteContent", "main"));
  return snap.exists() ? mergeContent(snap.data()) : DEFAULT_SITE_CONTENT;
}

export async function saveSiteContent(content: SiteContent) {
  if (!db) throw new Error("Firebase Firestore belum dikonfigurasi.");
  await setDoc(doc(db, "siteContent", "main"), { ...content, schemaVersion: 10, updatedAt: serverTimestamp() }, { merge: true });
}

export async function uploadCMSImage(file: File, section: string, index?: number) {
  if (!storage) throw new Error("Firebase Storage belum dikonfigurasi.");
  if (!file.type.startsWith("image/")) throw new Error("File harus berupa gambar.");
  if (file.size > 8 * 1024 * 1024) throw new Error("Ukuran gambar maksimal 8 MB.");
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `cms/${section}/${index ?? "single"}-${Date.now()}-${safeName}`;
  const fileRef = ref(storage, path);
  await uploadBytes(fileRef, file, { contentType: file.type, cacheControl: "public,max-age=31536000,immutable" });
  return getDownloadURL(fileRef);
}
