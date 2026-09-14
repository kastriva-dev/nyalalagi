# NyalaLagi — Tahap 6 Rating & Review

## Fitur
- Customer hanya dapat memberi rating setelah laporan berstatus `COMPLETED`.
- Rating 1–5 dan komentar disimpan di `technicianReviews/{reportId}`.
- Satu laporan hanya memiliki satu review.
- Field legacy `customerRating`, `customerNote`, dan `customerConfirmed` pada report tetap disimpan untuk kompatibilitas Stage 4/5.
- Cloud Function mengagregasi `ratingCount`, `ratingSum`, dan `ratingAverage` ke `users/{technicianId}`.
- Dashboard teknisi menampilkan rating rata-rata, jumlah penilaian, dan maksimal 5 ulasan terbaru.

## Deploy
Deploy frontend seperti biasa, lalu deploy Functions:

```bash
cd functions
npm install
cd ..
firebase deploy --only functions,firestore:rules
```

## Struktur Firestore
`technicianReviews/{reportId}`:
- `reportId`
- `customerId`
- `customerName`
- `technicianId`
- `rating`
- `comment`
- `createdAt`

`users/{technicianId}` akan memiliki:
- `ratingCount`
- `ratingSum`
- `ratingAverage`
