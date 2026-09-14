# NyalaLagi — Stage 5: Notification (Firebase Cloud Messaging)

Stage 5 menambahkan push notification untuk customer menggunakan `fcm_token` yang sudah tersedia di `users/{uid}`.

## Notifikasi
- Laporan berhasil dikirim
- Teknisi telah ditugaskan
- Teknisi sedang menuju lokasi
- Teknisi telah tiba
- Pekerjaan sedang dilakukan
- Pekerjaan selesai
- Tambahan: teknisi menolak/membatalkan pekerjaan

## Arsitektur
1. Customer membuka `/laporan`.
2. Customer menekan **Aktifkan notifikasi** jika browser belum memberi izin.
3. Browser mendapatkan FCM registration token menggunakan Web Push VAPID key.
4. Token disimpan ke `users/{uid}.fcm_token`.
5. Firebase Cloud Functions memantau `reports/{reportId}`.
6. Saat laporan dibuat/status berubah, Cloud Function mengambil token customer dan mengirim FCM push.
7. Saat web sedang terbuka, foreground message ditampilkan sebagai browser notification.
8. Saat PWA berada di background/ditutup, service worker menampilkan push notification.
9. Menekan notifikasi membuka laporan customer.

## Firebase Console
Buka Firebase Console → Project settings → Cloud Messaging → Web configuration.

Buat/ambil **Web Push certificate key pair** dan masukkan public key ke:

```env
NEXT_PUBLIC_FIREBASE_VAPID_KEY=...
```

Environment variable frontend lain tetap sama:
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

## Deploy

Frontend tetap:
```bash
npm install
npm run build
```

Deploy frontend ke Vercel seperti sebelumnya.

Cloud Functions:
```bash
cd functions
npm install
cd ..
firebase login
firebase deploy --only functions
```

`firebase.json` sekarang sudah menunjuk ke folder `functions`.

## Catatan penting
- Firebase Web API config boleh berada di frontend/service worker; jangan masukkan service-account private key ke frontend.
- Cloud Functions menggunakan Firebase Admin SDK sehingga tidak memerlukan service-account JSON di repository.
- Push notification browser membutuhkan HTTPS (localhost juga didukung untuk development) dan izin notifikasi dari customer.
- Jika customer memilih **Notifikasi diblokir**, izinnya harus dibuka kembali dari pengaturan situs/browser.
- `fcm_token` tetap berada di dokumen customer yang sudah digunakan Stage 1–4.
