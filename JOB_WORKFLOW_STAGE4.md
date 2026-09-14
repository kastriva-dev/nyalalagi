# NyalaLagi — Stage 4: Job Evidence & Customer Confirmation

Stage 4 melengkapi alur teknisi dengan dokumentasi pekerjaan dan konfirmasi pelanggan.

## Fitur
- Foto sebelum perbaikan (`beforePhotoUrls`).
- Foto sesudah perbaikan (`afterPhotoUrls`).
- Catatan hasil pekerjaan (`completionNote`).
- Teknisi wajib memiliki minimal 1 foto sesudah + catatan sebelum status `COMPLETED`.
- Pelanggan dapat mengonfirmasi pekerjaan setelah status `COMPLETED`.
- Pelanggan dapat memberi rating 1–5 dan catatan.
- Bukti pekerjaan dapat dilihat pelanggan dan teknisi yang ditugaskan.
- Storage Rules membatasi upload bukti hanya teknisi yang ditugaskan.
- Foto tidak dapat ditimpa karena upload memakai nama file unik dan `resource == null`.

## Alur teknisi
1. `ENGINEER_ASSIGNED` → `ENGINEER_ON_WAY`.
2. `ENGINEER_ON_WAY` → `ARRIVED`.
3. Setelah tiba, teknisi mengambil foto kondisi awal.
4. `ARRIVED` → `IN_PROGRESS`.
5. Teknisi dapat menambah foto selama pengerjaan.
6. Saat selesai, teknisi mengambil foto sesudah dan mengisi catatan hasil.
7. Sistem mengubah status menjadi `COMPLETED`.

## Alur pelanggan
1. Melihat teknisi dan status laporan.
2. Setelah selesai, pelanggan melihat dokumentasi pekerjaan.
3. Pelanggan memilih `Konfirmasi selesai`.
4. Pelanggan memberi rating dan catatan opsional.

## Catatan keamanan
- Semua perubahan tetap dikontrol Firestore Rules.
- Pelanggan hanya dapat mengonfirmasi laporan miliknya sendiri dan hanya satu kali.
- Teknisi tidak dapat mengubah identitas pelanggan, lokasi, deskripsi, atau status di luar transisi yang diizinkan.
