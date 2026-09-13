import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { db, storage } from "./firebase";

export type CMSService = { title: string; text: string; image: string };
export type CMSPortfolio = { title: string; image: string };
export type CMSTestimonial = { text: string; name: string; rating: number };

export type SiteContent = {
  hero: { eyebrow: string; title: string; highlight: string; description: string; image: string };
  about: { eyebrow: string; title: string; text1: string; text2: string; image: string; promiseLabel: string; promiseTitle: string; points: string[] };
  advantages: { title: string; text: string }[];
  services: CMSService[];
  portfolio: CMSPortfolio[];
  testimonial: { eyebrow: string; title: string; description: string; rating: string; ratingLabel: string; items: CMSTestimonial[] };
  partner: { eyebrow: string; title: string; text: string; benefits: { title: string; text: string }[] };
  vision: { eyebrow: string; title: string; visionTitle: string; visionText: string; missionTitle: string; missionText: string };
  cta: { eyebrow: string; title: string; text: string };
  footer: { address: string; phone: string; email: string; newsletterTitle: string; newsletterText: string };
};

export const DEFAULT_SITE_CONTENT: SiteContent = {
  hero: {
    eyebrow: "Mudah, Cepat, Berkualitas, Andalan",
    title: "NyalaLagi",
    highlight: "Penyedia Teknisi Listrik Andalan Anda",
    description: "NyalaLagi adalah platform digital di bawah naungan PT Nyalalagi Solusi Andalan yang menghubungkan masyarakat dengan tenaga ahli kelistrikan melalui layanan yang mudah, cepat, berkualitas dan menjadi andalan.",
    image: "/company/hero-1.jpg"
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
  advantages: [
    { title: "MUDAH", text: "Layanan berbasis teknologi digital membuat pelanggan lebih mudah mendapatkan service kelistrikan dalam satu genggaman." },
    { title: "CEPAT", text: "Proses laporan dan pencarian teknisi berbasis lokasi membantu mempercepat penanganan problem kelistrikan." },
    { title: "BERKUALITAS", text: "Didukung tenaga ahli kelistrikan yang mumpuni untuk memberikan hasil pekerjaan yang rapi, aman dan berkualitas." },
    { title: "ANDALAN", text: "Kemudahan, kecepatan dan kualitas menjadi komitmen NyalaLagi untuk menjadi penyedia teknisi listrik andalan masyarakat." }
  ],
  services: [
    { title: "Perbaikan Alat Instalasi Listrik", text: "Dengan dukungan teknisi listrik yang sangat berpengalaman, kami siap menyelesaikan semua kerusakan peralatan instalasi kelistrikan rumah Anda dengan hasil terbaik dan aman.", image: "/company/nyala-service-1.jpg" },
    { title: "Instalasi Listrik Baru", text: "Kami menyediakan instalasi pemasangan listrik baru untuk perumahan, gedung, perkantoran, pabrik dan tempat usaha lainnya dengan standar keamanan dan keselamatan yang tinggi, instalasi rapi dan berkualitas.", image: "/company/nyala-service-2.jpg" },
    { title: "Instalasi PJU & Maintenance", text: "Layanan instalasi dan maintenance Penerangan Jalan Umum (PJU) untuk menjaga pencahayaan tetap aman, efektif dan siap digunakan.", image: "/company/nyala-service-3.jpg" },
    { title: "Instalasi Penangkal Petir Rumah & Gedung", text: "Pemasangan sistem penangkal petir dengan perhatian pada grounding, material berkualitas dan standar keselamatan untuk rumah maupun gedung.", image: "/company/nyala-service-4.jpg" }
  ],
  portfolio: [
    { title: "Perbaikan Instalasi Rumah", image: "/company/nyala-portfolio-1.jpg" },
    { title: "Instalasi Listrik Baru", image: "/company/hero-2.jpg" },
    { title: "PJU & Maintenance", image: "/company/hero-3.jpg" },
    { title: "Penangkal Petir", image: "/company/hero-4.jpg" },
    { title: "Perbaikan Gangguan Listrik", image: "/company/service-gangguan.jpg" },
    { title: "Instalasi & Proteksi Kelistrikan", image: "/company/service-petir.jpg" }
  ],
  testimonial: {
    eyebrow: "Testimonial", title: "Dipercaya pelanggan, dinilai dari pengalaman.", description: "", rating: "5.0", ratingLabel: "Rating pelanggan",
    items: [
      { text: "Pelayanan cepat dan teknisinya komunikatif. Proses laporan juga terasa mudah.", name: "Pelanggan NyalaLagi", rating: 5 },
      { text: "Pekerjaan instalasinya rapi dan teknisi menjelaskan kondisi listrik dengan jelas.", name: "Pelanggan NyalaLagi", rating: 5 },
      { text: "Sangat membantu ketika ada gangguan listrik. Laporan bisa dibuat tanpa proses yang rumit.", name: "Pelanggan NyalaLagi", rating: 5 }
    ]
  },
  partner: {
    eyebrow: "Mitra Teknisi", title: "Benefit gabung mitra teknisi NyalaLagi", text: "Bergabung sebagai mitra teknisi dan jadilah bagian dari ekosistem layanan kelistrikan digital yang profesional.",
    benefits: [
      { title: "Peluang pekerjaan", text: "Dapatkan peluang pekerjaan kelistrikan dari pelanggan NyalaLagi." },
      { title: "Jangkauan lebih luas", text: "Perluas area layanan dan temukan pelanggan sesuai lokasi Anda." },
      { title: "Profil profesional", text: "Bangun reputasi sebagai mitra teknisi yang profesional dan terpercaya." },
      { title: "Teknologi terintegrasi", text: "Gunakan sistem digital untuk menerima dan mengelola permintaan layanan." }
    ]
  },
  vision: {
    eyebrow: "Visi & Misi", title: "Menjadi penyedia jasa teknisi listrik paling terpercaya.", visionTitle: "Visi Kami", visionText: "Menjadi perusahaan penyedia jasa teknisi listrik paling terpercaya untuk memastikan keamanan, kenyamanan pelanggan dan menjadi andalan masyarakat umum maupun dunia usaha.", missionTitle: "Misi Kami", missionText: "Memberikan layanan instalasi & perbaikan alat kelistrikan yang mudah, cepat, berkualitas & andalan; menghadirkan mitra teknisi yang berkompeten dan profesional melalui pelatihan berkelanjutan serta mendukung pemanfaatan inovasi teknologi digital."
  },
  cta: { eyebrow: "Butuh bantuan?", title: "Ada masalah listrik di rumah?", text: "Buat laporan melalui website atau hubungi NyalaLagi langsung melalui WhatsApp." },
  footer: { address: "Bandung Technopark Gedung C\nJl Komunikasi No 1, Sukapura Kabupaten Bandung", phone: "+62 851-9591-2262", email: "cs@nyalalagi.com", newsletterTitle: "Our Newsletter", newsletterText: "Subscribe to our newsletter and receive the latest news about our products and services!" }
};

function mergeContent(raw: Partial<SiteContent> | undefined): SiteContent {
  const r = raw || {};
  return {
    ...DEFAULT_SITE_CONTENT,
    ...r,
    hero: { ...DEFAULT_SITE_CONTENT.hero, ...(r.hero || {}) },
    about: { ...DEFAULT_SITE_CONTENT.about, ...(r.about || {}), points: r.about?.points || DEFAULT_SITE_CONTENT.about.points },
    advantages: Array.isArray(r.advantages) ? r.advantages : DEFAULT_SITE_CONTENT.advantages,
    services: Array.isArray(r.services) ? r.services : DEFAULT_SITE_CONTENT.services,
    portfolio: Array.from({ length: 6 }, (_, i) => ({
      ...(DEFAULT_SITE_CONTENT.portfolio[i] || { title: `Portfolio ${i + 1}`, image: "" }),
      ...((Array.isArray(r.portfolio) ? r.portfolio : [])[i] || {})
    })),
    testimonial: { ...DEFAULT_SITE_CONTENT.testimonial, ...(r.testimonial || {}), items: Array.isArray(r.testimonial?.items) ? r.testimonial!.items : DEFAULT_SITE_CONTENT.testimonial.items },
    partner: { ...DEFAULT_SITE_CONTENT.partner, ...(r.partner || {}), benefits: Array.isArray(r.partner?.benefits) ? r.partner!.benefits : DEFAULT_SITE_CONTENT.partner.benefits },
    vision: { ...DEFAULT_SITE_CONTENT.vision, ...(r.vision || {}) },
    cta: { ...DEFAULT_SITE_CONTENT.cta, ...(r.cta || {}) },
    footer: { ...DEFAULT_SITE_CONTENT.footer, ...(r.footer || {}) }
  };
}

export async function getSiteContent(): Promise<SiteContent> {
  if (!db) return DEFAULT_SITE_CONTENT;
  const snap = await getDoc(doc(db, "siteContent", "main"));
  return snap.exists() ? mergeContent(snap.data() as Partial<SiteContent>) : DEFAULT_SITE_CONTENT;
}

export async function saveSiteContent(content: SiteContent) {
  if (!db) throw new Error("Firebase Firestore belum dikonfigurasi.");
  await setDoc(doc(db, "siteContent", "main"), { ...content, updatedAt: serverTimestamp() }, { merge: true });
}

export async function uploadCMSImage(file: File, section: string, index?: number) {
  if (!storage) throw new Error("Firebase Storage belum dikonfigurasi.");
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `cms/${section}/${index ?? "single"}-${Date.now()}-${safeName}`;
  const fileRef = ref(storage, path);
  await uploadBytes(fileRef, file, { contentType: file.type });
  return getDownloadURL(fileRef);
}
