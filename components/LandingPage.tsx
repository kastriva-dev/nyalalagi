 "use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, CheckCircle2, Clock3, MapPin, ShieldCheck, Zap, Menu, Phone, Star } from "lucide-react";

const services = [
  {
    title: "Laporan Gangguan Kerusakan Listrik",
    text: "Laporkan masalah listrik rumah dengan proses mudah dan dapatkan bantuan teknisi.",
    image: "/company/service-gangguan.jpg"
  },
  {
    title: "Instalasi Listrik Perumahan & Gedung",
    text: "Pemasangan instalasi listrik baru untuk perumahan, gedung perkantoran dan tempat usaha.",
    image: "/company/service-instalasi.jpg"
  },
  {
    title: "Penerangan Jalan Umum (PJU)",
    text: "Perencanaan, pengadaan material, instalasi tiang dan lampu untuk infrastruktur PJU.",
    image: "/company/service-pju.jpg"
  },
  {
    title: "Penangkal Petir Rumah & Gedung",
    text: "Pemasangan dengan perhatian pada grounding, material berkualitas dan standar keselamatan.",
    image: "/company/service-petir.jpg"
  }
];

const advantages = [
  ["MUDAH", "Dengan layanan berbasis teknologi digital pelanggan dengan mudah mendapatkan service terbaik hanya dalam satu genggaman.", Zap],
  ["CEPAT", "Fitur pencarian teknisi terdekat membantu mempercepat penanganan problem kelistrikan.", Clock3],
  ["BERKUALITAS", "Didukung tenaga ahli listrik yang mumpuni untuk memberikan kualitas layanan yang prima.", ShieldCheck],
  ["ANDALAN", "Kemudahan, kecepatan dan kualitas menjadikan NyalaLagi platform andalan untuk masalah kelistrikan.", Star]
];

export default function LandingPage() {
  return (
    <main>
      <header className="nav">
        <div className="container nav-inner">
          <Link href="/" className="brand">
            <Image src="/company/logo.png" alt="NyalaLagi" width={42} height={42} />
            NyalaLagi
          </Link>
          <nav className="nav-links">
            <a href="#tentang">Tentang</a>
            <a href="#keunggulan">Keunggulan</a>
            <a href="#layanan">Layanan</a>
            <a href="#visi">Visi & Misi</a>
            <a href="#kontak">Kontak</a>
          </nav>
          <div className="nav-actions">
            <Link href="/laporan" className="btn btn-secondary">Laporan Saya</Link>
            <Link href="/lapor" className="btn btn-primary">Laporkan Gangguan</Link>
          </div>
          <Menu className="mobile-menu" />
        </div>
      </header>

      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-copy">
            <span className="eyebrow"><Zap size={15} /> Layanan kelistrikan digital</span>
            <h1>Listrik mati tinggal click <span style={{color:"#5a45d6"}}>&quot;NyalaLagi&quot;</span></h1>
            <p className="muted">
              NyalaLagi adalah platform digital di bawah naungan PT Nyalalagi Solusi Andalan
              yang mempertemukan masyarakat dengan teknisi listrik terbaik dengan proses yang
              mudah, penyelesaian cepat, hasil berkualitas dan service yang menjadi andalan.
            </p>
            <div className="hero-buttons">
              <Link href="/lapor" className="btn btn-primary">Laporkan Masalah <ArrowRight size={18}/></Link>
              <a href="#tentang" className="btn btn-secondary">Pelajari NyalaLagi</a>
            </div>
            <div style={{display:"flex",gap:22,marginTop:28,flexWrap:"wrap"}}>
              <span><CheckCircle2 size={17} style={{verticalAlign:"middle",marginRight:6}}/> Teknisi terdaftar</span>
              <span><MapPin size={17} style={{verticalAlign:"middle",marginRight:6}}/> Berbasis lokasi</span>
            </div>
          </div>
          <div className="hero-visual">
            <img className="photo-main" src="/company/hero.jpg" alt="Teknisi NyalaLagi" />
            <img className="photo-small ps1" src="/company/hero-2.jpg" alt="Teknisi listrik" />
            <img className="photo-small ps2" src="/company/hero-3.jpg" alt="Pekerjaan listrik" />
            <img className="photo-small ps3" src="/company/hero-4.jpg" alt="Panel listrik" />
            <div className="floating-card">
              <div className="iconbox"><MapPin size={21}/></div>
              <div><b>Teknisi terdekat</b><br/><small className="muted">Permintaan dapat diproses berbasis lokasi</small></div>
            </div>
          </div>
        </div>
      </section>

      <section id="tentang" className="section">
        <div className="container">
          <span className="eyebrow">Profil Perusahaan</span>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:45,marginTop:22}}>
            <div>
              <h2>Solusi kelistrikan dalam satu genggaman.</h2>
            </div>
            <div>
              <p className="muted">
                Dengan dukungan teknologi digital yang canggih dan tenaga ahli kelistrikan
                yang berpengalaman, NyalaLagi bertujuan menjadi penyedia jasa teknisi listrik
                yang terkemuka di Indonesia dan menjadi andalan masyarakat.
              </p>
              <p className="muted">
                NyalaLagi berada di bawah naungan <b>PT NYALALAGI SOLUSI ANDALAN</b>.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="keunggulan" className="section" style={{background:"#fff"}}>
        <div className="container">
          <div style={{textAlign:"center",maxWidth:700,margin:"0 auto 35px"}}>
            <span className="eyebrow">Keunggulan Kami</span>
            <h2 style={{marginTop:16}}>Mudah. Cepat. Berkualitas. Andalan.</h2>
          </div>
          <div className="grid-4">
            {advantages.map(([title,text,Icon]) => (
              <div className="card feature-card" key={String(title)}>
                <div className="iconbox"><Icon size={21}/></div>
                <h3>{title}</h3>
                <p className="muted">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="layanan" className="section">
        <div className="container">
          <span className="eyebrow">Layanan Kami</span>
          <h2 style={{marginTop:16}}>Dari gangguan rumah hingga proyek kelistrikan.</h2>
          <div className="grid-4" style={{marginTop:30}}>
            {services.map((s) => (
              <article className="card service-card" key={s.title}>
                <img src={s.image} alt={s.title}/>
                <div className="service-body">
                  <h3>{s.title}</h3>
                  <p className="muted">{s.text}</p>
                  {s.title.startsWith("Laporan") && <Link href="/lapor" className="btn btn-primary">Laporkan <ArrowRight size={16}/></Link>}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="visi" className="section dark-section">
        <div className="container">
          <span className="eyebrow">Visi & Misi</span>
          <div className="grid-3" style={{marginTop:24}}>
            <div>
              <h2>Menjadi penyedia jasa teknisi listrik paling terpercaya.</h2>
            </div>
            <div className="card" style={{background:"rgba(255,255,255,.07)",borderColor:"rgba(255,255,255,.12)"}}>
              <h3>Visi Kami</h3>
              <p className="muted">Menjadi perusahaan penyedia jasa teknisi listrik paling terpercaya untuk memastikan keamanan, kenyamanan pelanggan dan menjadi andalan masyarakat umum maupun dunia usaha.</p>
            </div>
            <div className="card" style={{background:"rgba(255,255,255,.07)",borderColor:"rgba(255,255,255,.12)"}}>
              <h3>Misi Kami</h3>
              <p className="muted">Memberikan layanan instalasi & perbaikan alat kelistrikan yang mudah, cepat, berkualitas & andalan; menghadirkan mitra teknisi yang berkompeten, profesional melalui pelatihan berkelanjutan & bersertifikat sesuai standar nasional; serta mendukung pemanfaatan inovasi teknologi digital.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="cta">
            <div>
              <h2 style={{marginBottom:10}}>Ada masalah listrik di rumah?</h2>
              <p style={{margin:0}}>Kirim laporan, lokasi dan foto kerusakan agar penanganan bisa lebih cepat.</p>
            </div>
            <Link href="/lapor" className="btn btn-dark">Buat Laporan <ArrowRight size={18}/></Link>
          </div>
        </div>
      </section>

      <footer id="kontak" className="footer">
        <div className="container footer-grid">
          <div>
            <div className="brand" style={{color:"#fff"}}>
              <Image src="/company/logo.png" alt="" width={42} height={42}/> NyalaLagi
            </div>
            <p style={{color:"#aaa6bf",lineHeight:1.8}}>PT NYALALAGI SOLUSI ANDALAN<br/>Mudah, Cepat, Berkualitas & Andalan.</p>
          </div>
          <div>
            <h3>Kontak</h3>
            <p><Phone size={15} style={{verticalAlign:"middle",marginRight:7}}/> +62 851 9591 2262</p>
            <p>cs@nyalalagi.com</p>
          </div>
          <div>
            <h3>Alamat</h3>
            <p style={{color:"#aaa6bf"}}>Pasindangan No 34, Cirebon</p>
            <p style={{color:"#aaa6bf"}}>www.nyalalagi.com</p>
          </div>
        </div>
        <div className="container" style={{marginTop:35,borderTop:"1px solid rgba(255,255,255,.1)",paddingTop:20}}>
          <small>© {new Date().getFullYear()} PT Nyalalagi Solusi Andalan. All rights reserved.</small>
        </div>
      </footer>

      <nav className="bottom-nav">
        <Link href="/"><span>⌂</span>Beranda</Link>
        <Link href="/lapor" className="primary"><span>⚡</span>Laporkan</Link>
        <Link href="/laporan"><span>☰</span>Laporan</Link>
      </nav>
    </main>
  );
}
