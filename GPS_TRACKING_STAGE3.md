# NyalaLagi — Tahap 3: GPS & Live Tracking

## Fitur
- Teknisi mengirim lokasi GPS secara realtime ketika status `ENGINEER_ON_WAY`.
- Penulisan lokasi di-throttle: minimal 10 detik atau perpindahan sekitar 25 meter.
- Pelanggan melihat posisi teknisi pada peta hanya untuk laporan miliknya.
- Tracking otomatis berhenti ketika status berubah menjadi `ARRIVED`, `IN_PROGRESS`, `COMPLETED`, `REJECTED`, atau `CANCELLED`.
- Dokumen `reportTracking/{reportId}` diproteksi Firestore Rules agar hanya pelanggan terkait, teknisi terkait, dan admin yang dapat membaca.
- Teknisi tidak dapat menulis tracking untuk laporan teknisi lain.

## Catatan deployment
1. Browser/perangkat teknisi harus memberikan izin lokasi.
2. Geolocation web umumnya memerlukan HTTPS (Vercel sudah HTTPS).
3. Deploy `firestore.rules` bersama aplikasi.
4. Karena lokasi realtime menambah operasi Firestore, interval penulisan sengaja dibatasi agar lebih hemat biaya.
5. Pelacakan berhenti setelah teknisi tiba untuk membatasi penyimpanan data lokasi dan menjaga privasi.
