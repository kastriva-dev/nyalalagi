# FCM TypeScript Fix

Perbaikan untuk build Vercel pada `components/FCMNotificationProvider.tsx`.

Masalah:
`app` dari `lib/firebase.ts` bertipe `FirebaseApp | null`, sedangkan `getMessaging()` hanya menerima `FirebaseApp | undefined`. TypeScript kehilangan narrowing `!app` di dalam callback async `onAuthStateChanged`.

Perbaikan:
- Menyimpan `app`, `auth`, dan `db` yang sudah lolos null-check ke variabel lokal non-null.
- Menggunakan `firebaseApp` untuk seluruh pemanggilan `getMessaging()`.
- Menggunakan `firebaseAuth` dan `firestore` pada proses registrasi notifikasi.

Tidak ada perubahan pada alur FCM, Firestore, token, atau izin notifikasi.
