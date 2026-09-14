# Tahap 8 — Premium Landing Page

Landing page NyalaLagi diperbarui tanpa mengubah backend Firebase, autentikasi, laporan, tracking, notifikasi, rating/review, atau dashboard admin.

## Perubahan
- Hero utama dengan pesan: **"Masalah listrik? NyalaLagi yang urus."**
- Glassmorphism yang lebih konsisten.
- Typography, spacing, shadow, border dan radius diperhalus.
- Hover animation dan micro-interaction pada tombol/kartu.
- Responsive desktop/tablet/mobile.
- Section **Cara Kerja**: buat laporan → cari teknisi → teknisi menangani → selesai & rating.
- Section **Teknisi Terpercaya** dengan penjelasan registrasi, lokasi, status, dan rating.
- Section layanan tetap menggunakan data CMS yang sudah ada.
- Section testimonial tetap menggunakan data CMS.
- Section FAQ interaktif menggunakan `<details>` tanpa library tambahan.
- CTA laporan gangguan diperjelas dengan Website + WhatsApp.
- Navigasi desktop/mobile diperbarui agar sesuai section baru.
- Footer link diperbarui.

## Backend aman
Tahap ini hanya menyentuh presentasi landing page dan tidak mengubah struktur Firestore, Firebase Functions, Storage rules, atau workflow laporan.

## File utama
- `components/LandingPage.tsx`
- `app/globals.css`
- `ADMIN_LANDING_STAGE8.md`

## Validasi
- Transpilasi TypeScript/JSX untuk `LandingPage.tsx` berhasil.
- Perbaikan sintaks pada `AdminPage.tsx` juga sudah dilakukan agar file dapat ditranspilasi.
- `npm run build` belum dapat dijalankan karena executable `next` tidak tersedia pada environment pengerjaan (`next: not found`).
