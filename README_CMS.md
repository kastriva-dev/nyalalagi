# NyalaLagi CMS — Tahap 10

CMS website NyalaLagi menggunakan Firebase Firestore + Firebase Storage dan hanya dapat disimpan oleh akun dengan `users/{uid}.role = "admin"`.

## Cara membuka CMS
1. Login sebagai admin.
2. Buka Admin Console.
3. Klik **Edit Website · CMS**.
4. Landing page terbuka dengan `?adminEdit=1`.
5. Klik **Buka CMS Lengkap**.
6. Pilih section di sidebar, ubah konten, lalu klik **Simpan Perubahan**.

## Section yang dapat dikelola
- Hero
- Tentang
- Keunggulan
- Layanan
- Portfolio
- Cara Kerja
- Testimonial
- Teknisi
- FAQ
- CTA
- Footer
- SEO

CMS mendukung tambah/hapus/urutkan item untuk layanan, portfolio, cara kerja, testimonial, FAQ, link footer, serta upload gambar ke Firebase Storage.

## Penyimpanan
- Firestore: `siteContent/main`
- Schema: `schemaVersion: 10`
- Gambar CMS: `Firebase Storage /cms/...`

Data CMS lama dari Tahap 8/9 tetap dibaca melalui mekanisme migrasi/fallback `mergeContent()`. Saat admin menyimpan dari CMS Tahap 10, format baru akan diterbitkan.

## SEO
SEO title, description, keywords, canonical URL, Open Graph, robots index/follow dapat diubah dari CMS. Homepage juga membaca SEO dari Firestore untuk `generateMetadata()` dengan cache 5 menit dan fallback default jika Firestore tidak tersedia.

## Rules wajib dideploy
Setelah source Tahap 10 digunakan, deploy Firestore + Storage rules:

```bash
firebase deploy --only firestore:rules,storage
```

`siteContent` dapat dibaca publik untuk landing page, tetapi hanya admin yang dapat mengubahnya. Folder Storage `/cms/...` dapat dibaca publik dan hanya admin yang dapat upload/update/delete gambar.
