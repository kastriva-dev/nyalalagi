# NyalaLagi CMS

CMS landing page NyalaLagi menggunakan Firebase Firestore + Firebase Storage tanpa library tambahan.

## Cara menggunakan
1. Login menggunakan akun admin.
2. Dari Admin Console klik **Edit Website**.
3. URL landing akan terbuka dengan mode `?adminEdit=1`.
4. Klik ikon pensil pada gambar Hero, Tentang, Layanan, dan Portfolio untuk mengganti gambar langsung.
5. Klik **Buka CMS Lengkap** untuk mengubah teks dan konten lain.
6. Klik **Simpan Perubahan** untuk menerbitkan perubahan.

## Data CMS
Firestore document:
`siteContent/main`

Gambar CMS:
`Firebase Storage /cms/...`

Landing page memiliki fallback ke konten default jika document CMS belum dibuat. Document CMS dibuat otomatis saat admin pertama kali menyimpan.

## Firebase Rules
Deploy rules terbaru setelah mengganti source:
```bash
firebase deploy --only firestore:rules,storage
```

Pastikan akun yang dipakai sebagai admin sudah memiliki:
`users/{uid}.role = "admin"`
