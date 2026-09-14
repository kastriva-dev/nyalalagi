# Technician Firestore TypeScript Fix

Perbaikan build Tahap 8 untuk TypeScript strict null check pada `components/TechnicianPage.tsx`.

`db` dari `lib/firebase.ts` bertipe `Firestore | null` karena aplikasi tetap aman saat konfigurasi Firebase belum tersedia. Pada callback GPS (`publish`) dan callback `forEach`, TypeScript tidak mempertahankan narrowing dari `if (!db || !user) return`.

Solusi: setelah guard, instance Firestore disimpan sebagai `const firestore = db` lalu callback menggunakan `firestore`. Runtime guard tetap dipertahankan dan tidak ada non-null assertion paksa.
