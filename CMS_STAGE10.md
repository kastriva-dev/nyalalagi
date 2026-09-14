# Tahap 10 — Full Website CMS

Tahap 10 mengembangkan CMS NyalaLagi menjadi pengelolaan landing page penuh tanpa edit source code.

## Struktur konten
`siteContent/main` menyimpan Hero, Tentang, Keunggulan, Layanan, Portfolio, Cara Kerja, Testimonial, Teknisi, FAQ, CTA, Footer, SEO serta konten lama Partner dan Visi/Misi agar kompatibel dengan stage sebelumnya.

## Kemampuan editor
- Edit heading, description, CTA label dan contact.
- Upload/replace gambar Hero, Tentang, Layanan, Portfolio dan Open Graph.
- Tambah/hapus/urutkan layanan.
- Tambah/hapus/urutkan portfolio.
- Tambah/hapus/urutkan langkah Cara Kerja.
- Tambah/hapus/urutkan testimonial.
- Tambah/hapus/urutkan FAQ.
- Kelola trust badge dan poin teknisi.
- Kelola link footer dan URL social media.
- Kelola SEO title/description/keywords/canonical/Open Graph/robots.
- Preview SERP sederhana di editor SEO.

## Kompatibilitas
`mergeContent()` mendeteksi format lama saat `advantages`, `services`, atau `portfolio` masih berupa array dan mengubahnya di runtime ke struktur Tahap 10. Fallback default menjaga landing tetap tampil jika document belum dibuat atau field belum lengkap.

## Keamanan
Firestore: public read untuk `siteContent`, admin-only write.
Storage: `/cms/**` public read, admin-only create/update/delete dengan pembatasan image dan ukuran maksimum 8 MB.
