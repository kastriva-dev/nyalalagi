# NyalaLagi - Tahap 1 Security Hardening

Perubahan utama:

- Firestore user profile dibatasi ke field yang diizinkan saat pendaftaran.
- Customer tidak dapat menaikkan role, mengubah balance, status akun, atau createdAt.
- Customer report update dibatasi hanya ke problemType, description, location, photoUrls, dan updatedAt.
- Customer tidak dapat mengubah customerId, status laporan, createdAt, atau assignment.
- Akses report teknisi dibatasi hanya jika `request.auth.token.engineer == true` dan `technicianId` sama dengan UID teknisi.
- Storage report dibatasi ke pemilik laporan, teknisi yang ditugaskan, atau admin untuk read.
- Upload foto report hanya dapat dilakukan oleh pemilik report yang benar.
- Storage profile dibatasi ke pemilik profile atau admin.
- Upload dibatasi ke image MIME type dan ukuran maksimum.
- File Storage bersifat immutable setelah dibuat pada Tahap 1; update/delete ditolak untuk mencegah overwrite lintas sesi.

## Catatan deployment

Deploy rules ini bersama project:

```bash
firebase deploy --only firestore:rules,storage
```

## Penting

Tahap 2 akan menambahkan struktur dan alur assignment teknisi secara lengkap. Rules Tahap 1 sudah menyiapkan akses teknisi berbasis `technicianId`, sehingga dokumen report yang sudah memiliki assignment akan otomatis dapat dibaca oleh teknisi yang tepat.
