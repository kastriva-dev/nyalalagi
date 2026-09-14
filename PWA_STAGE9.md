# NyalaLagi — Tahap 9 PWA

Tahap 9 menyempurnakan PWA customer tanpa mengubah alur Firebase/Firestore yang sudah berjalan.

## Fitur

- Offline fallback khusus (`/offline.html`).
- Strategi cache terpisah:
  - navigation: network-first;
  - `/_next/static`: cache-first;
  - image/static company assets: stale-while-revalidate.
- Halaman customer/authenticated tidak disimpan sebagai HTML offline agar data pribadi dan status pekerjaan tidak menjadi stale.
- Service worker dibuat otomatis sebelum `next build` melalui `scripts/generate-sw.mjs`.
- Cache version menggunakan `VERCEL_GIT_COMMIT_SHA`, sehingga deploy baru otomatis menggunakan cache baru.
- UI update service worker dengan tombol **Perbarui** dan `SKIP_WAITING`.
- Pemeriksaan update ketika tab aktif kembali dan setiap 1 jam.
- Custom install prompt pada browser Chromium dan petunjuk Add to Home Screen pada iOS.
- Splash saat PWA standalone pertama kali dibuka pada sesi tersebut.
- Loading UI melalui `app/loading.tsx`.
- Navigasi mobile global untuk Beranda, Laporkan, Laporan, dan Akun.
- Ikon PWA 192/512, maskable, Apple Touch Icon dan notification badge.
- Manifest memiliki shortcuts untuk Buat Laporan dan Laporan Saya.
- Status offline ditampilkan ketika koneksi terputus.

## Deployment

Tidak diperlukan dependency PWA tambahan. `npm run build` otomatis menjalankan:

```bash
node scripts/generate-sw.mjs
next build
```

Environment Firebase yang sebelumnya digunakan tetap dipakai untuk menanam konfigurasi Web FCM ke service worker pada build.

## Catatan cache

Service worker sengaja tidak melakukan cache halaman `/lapor`, `/laporan`, `/login`, `/admin`, atau `/teknisi` sebagai dokumen HTML. Saat offline, navigasi ke halaman tersebut akan menampilkan fallback offline. Static JavaScript/CSS/image yang sudah pernah dimuat tetap dapat berasal dari cache.
