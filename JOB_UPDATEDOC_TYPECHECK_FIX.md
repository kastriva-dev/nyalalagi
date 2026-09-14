# Vercel TypeScript Fix — lib/job.ts

Perbaikan untuk error Vercel:

`Cannot find name 'updateDoc'` pada `lib/job.ts`.

`updateDoc` memang digunakan oleh `saveJobPhotos()` dan `completeJob()`, tetapi import-nya sempat terhapus saat refactor transaksi rating/review.

Import Firestore sekarang mencakup:

```ts
import { collection, doc, runTransaction, serverTimestamp, updateDoc } from "firebase/firestore";
```

Tidak ada perubahan pada alur bisnis atau Firestore rules.
