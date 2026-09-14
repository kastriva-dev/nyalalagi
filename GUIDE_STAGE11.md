# Tahap 11 — Panduan Admin NyalaLagi

Tahap ini menambahkan pusat panduan operasional lengkap yang hanya dapat diakses oleh akun `role=admin`.

## Akses

- Dashboard admin: `/admin`
- Panduan admin: `/admin/panduan`
- Tombol **Panduan** berada di kanan atas dashboard admin, di area topbar dekat status sistem dan tombol Keluar.

## Isi panduan

Panduan mencakup:

1. Login dan hak akses Admin / Customer / Teknisi.
2. Dashboard operasional dan statistik.
3. Manajemen customer dan pencarian email.
4. Manajemen laporan dan assignment teknisi.
5. Manajemen teknisi dan rating.
6. Alur customer.
7. Alur teknisi dan GPS tracking.
8. Siklus status laporan.
9. Bukti pekerjaan sebelum/sesudah.
10. FCM / push notification.
11. CMS landing page lengkap.
12. SEO.
13. PWA, offline, install, cache dan update.
14. Firestore / Storage security.
15. Troubleshooting dasar.

## UX

- Search seluruh isi panduan.
- Filter kategori: Dasar, Admin, Customer, Teknisi, Operasional, Sistem, Website, Bantuan.
- Daftar isi sticky pada desktop.
- Quick links.
- Ringkasan flow status laporan.
- Responsive mobile.
- Tombol cetak / print-friendly.
- Halaman memiliki `robots: noindex, nofollow`.

## Security

`AdminGuidePage` memverifikasi Firebase Authentication dan profil `users/{uid}`. User non-admin diarahkan keluar dari area panduan.
