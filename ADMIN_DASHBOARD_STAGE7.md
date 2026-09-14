# NyalaLagi — Tahap 7 Admin Dashboard

Tahap ini mengubah Admin Dashboard menjadi dashboard operasional yang scalable.

## Fitur
- KPI Customer, Teknisi, Laporan, Selesai.
- Laporan 7 hari terakhir berdasarkan `reports.createdAt`.
- Status workload: mencari teknisi, ditugaskan, menuju lokasi, pengerjaan, selesai.
- Customer terbaru dibatasi 5 hasil tampilan, query hanya 20 dokumen.
- Data Customer, Teknisi, dan Laporan menggunakan cursor pagination, maksimal 20 dokumen/query.
- Search customer/teknisi menggunakan server-side email prefix query, bukan memuat seluruh collection.
- Statistik menggunakan Firestore `count()` aggregation (`getCountFromServer`) sehingga tidak mengambil seluruh dokumen ke browser.
- Daftar teknisi untuk assignment dibatasi maksimal 100 akun aktif setelah filtering di client.
- Rating teknisi menampilkan `ratingAverage` dan `ratingCount` dari Tahap 6.

## Prinsip skalabilitas
Dashboard tidak lagi menggunakan `onSnapshot(collection(...))` untuk seluruh `users` dan `reports`. Ini penting ketika data sudah ribuan/ratusan ribu dokumen.

Query yang digunakan:
- Count: Firestore aggregation count.
- 7 hari: hanya laporan dengan `createdAt >= awal hari 6 hari lalu`.
- Tabel: `orderBy(createdAt desc) + limit(20) + startAfter(cursor)`.
- Search user: range prefix pada field `email` + `limit(20)`.

## Catatan index
Query di atas sengaja dirancang agar tidak membutuhkan composite index untuk kombinasi role + status + orderBy. Jika project Anda sudah memiliki custom index lain, index tersebut tetap boleh dipertahankan.

## Deploy
```bash
npm install
npm run build
firebase deploy --only firestore:rules,functions
```

Cloud Functions dari Tahap 5/6 tetap dipertahankan.
