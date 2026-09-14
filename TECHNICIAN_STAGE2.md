# NyalaLagi — Tahap 2: Technician Workflow

## Yang ditambahkan
- Role `technician` berbasis dokumen `users/{uid}`.
- Admin dapat mempromosikan customer aktif menjadi technician.
- Admin dapat menugaskan technician ke report.
- Report menyimpan `technicianId`, nama/nomor technician dan timestamp assignment.
- Halaman `/teknisi` untuk melihat pekerjaan technician secara realtime.
- Technician dapat menjalankan workflow:
  - ENGINEER_ASSIGNED → ENGINEER_ON_WAY
  - ENGINEER_ON_WAY → ARRIVED
  - ARRIVED → IN_PROGRESS
  - IN_PROGRESS → COMPLETED
  - Setiap tahap aktif juga dapat berakhir dengan REJECTED.
- Firestore Rules memeriksa role technician langsung dari `users/{uid}`, bukan custom claim `engineer`.
- Technician hanya dapat membaca report yang ditugaskan kepada UID-nya.
- Technician hanya dapat mengubah field status/timestamp yang diperbolehkan dan tidak dapat mengubah data customer/report.
- Storage report dapat dibaca customer pemilik, technician yang ditugaskan, atau admin.
- Login mengarahkan technician ke `/teknisi`.

## Catatan penting
Tahap ini menggunakan technician yang sudah memiliki akun Firebase Auth. Admin dapat mengubah role dokumen user yang sudah ada menjadi `technician`; pembuatan akun Firebase Auth khusus technician dari dashboard belum dilakukan karena client-side Firebase tidak boleh membuat akun lain menggunakan kredensial admin.

Sebelum production, sebaiknya tahap berikutnya menambahkan Cloud Functions/secure server endpoint untuk assignment otomatis, notifikasi FCM, audit log, dan validasi bisnis yang lebih ketat.
