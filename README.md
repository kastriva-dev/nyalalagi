# NyalaLagi Customer PWA

Customer WebApp/PWA untuk PT Nyalalagi Solusi Andalan.

## Fitur

- Landing page/company profile berdasarkan Company Profile Nyalalagi v1
- Responsive mobile-first
- Installable PWA
- Laporan gangguan listrik
- Geolocation GPS dengan high accuracy
- Pilih titik lokasi langsung di peta
- Menyimpan latitude, longitude, accuracy dan timestamp
- Upload sampai 5 foto kerusakan
- Firebase Authentication (email/password customer account)
- Firestore untuk laporan
- Firebase Storage untuk foto
- Halaman Laporan Saya dengan realtime listener
- Status workflow: SEARCHING_ENGINEER → ENGINEER_ASSIGNED → ENGINEER_ON_WAY → IN_PROGRESS → COMPLETED
- Firestore dan Storage Security Rules
- Siap deploy ke Vercel

## 1. Jalankan lokal

```bash
npm install
copy .env.example .env.local
npm run dev
```

Linux/macOS:

```bash
cp .env.example .env.local
npm install
npm run dev
```

## 2. Firebase

Buat/gunakan Firebase Project milik NyalaLagi.

Aktifkan:
1. Authentication → Sign-in method → Email/Password
2. Cloud Firestore
3. Storage

Masukkan konfigurasi Firebase Web App ke `.env.local`.

Contoh:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
NEXT_PUBLIC_APP_URL=https://nyalalagi.com
```

> Jangan masukkan service-account private key ke frontend.

## 3. Struktur data Firestore

Collection:

`reports/{reportId}`

Contoh dokumen:

```json
{
  "customerId": "firebase-auth-uid",
  "customerName": "Nama Customer",
  "customerPhone": "08xxxxxxxxxx",
  "problemType": "Listrik padam total",
  "description": "Listrik rumah tiba-tiba mati",
  "location": {
    "latitude": -6.123456,
    "longitude": 107.123456,
    "accuracy": 8,
    "capturedAt": "2026-09-12T12:00:00.000Z",
    "address": "Alamat/patokan"
  },
  "photoUrls": [],
  "status": "SEARCHING_ENGINEER",
  "createdAt": "serverTimestamp",
  "updatedAt": "serverTimestamp"
}
```

### Penting untuk integrasi aplikasi Engineer

Project ini mengasumsikan collection `reports` digunakan sebagai collection laporan customer.

Karena struktur Firebase aplikasi Engineer NyalaLagi yang sudah berjalan belum diberikan, **jangan langsung menimpa collection produksi**. Sesuaikan nama collection, field, status dan custom claims dengan backend NyalaLagi yang sebenarnya.

Security Rules sudah menyiapkan pola:
- customer → laporan miliknya
- engineer → akses laporan jika field `users/{uid}.role == "technician"`
- admin → akses laporan jika custom claim `admin == true`

Jika aplikasi Engineer memakai struktur/claim berbeda, rules harus disesuaikan.

## 4. Deploy Vercel

Push repository ke GitHub lalu import repository tersebut di Vercel.

Tambahkan semua environment variables dari `.env.local` di:

Vercel → Project → Settings → Environment Variables

Kemudian Deploy.

## 5. PWA

Service worker berada di:

`public/sw.js`

Manifest:

`public/manifest.webmanifest`

PWA akan terdaftar otomatis melalui `PWARegister`.

## 6. Catatan GPS

Browser dapat mengambil lokasi ketika customer memberikan izin.

Saat tombol "Gunakan lokasi saya" ditekan:
- `enableHighAccuracy: true`
- lokasi tidak disimpan sebagai alamat saja
- latitude/longitude/accuracy/timestamp disimpan ke Firestore

Untuk live tracking background terus-menerus, gunakan aplikasi Android/native Engineer/Customer. Jangan mengandalkan browser PWA yang ditutup untuk background GPS.

## 7. Foto

Foto customer disimpan ke:

`reports/{reportId}/{fileName}`

URL hasil upload disimpan pada:

`reports/{reportId}.photoUrls`

Ukuran maksimum contoh rule: 10 MB/foto.

## 8. Company profile source

Konten landing page mengikuti materi `Company Profile Nyalalagi v1.pptx` yang diberikan oleh pihak pengguna. Materi tersebut menyebut:
- PT Nyalalagi Solusi Andalan
- tagline: Mudah, Cepat, Berkualitas & Andalan
- visi dan misi
- keunggulan Mudah, Cepat, Berkualitas, Andalan
- layanan gangguan listrik, instalasi perumahan/gedung, PJU dan penangkal petir
- kontak +62 851 9591 2262, cs@nyalalagi.com, Pasindangan No 34, Cirebon

## 9. Sebelum production

Wajib sinkronkan dengan sistem NyalaLagi yang sudah ada:
- Firebase project ID
- Firestore collection
- field names
- status enum
- Authentication model
- engineer/admin custom claims
- storage path
- notifikasi ke Engineer
- mekanisme assignment teknisi
- privacy/consent
- domain Vercel/nyalalagi.com

Project ini sengaja tidak menambahkan Firebase Admin SDK/service account ke frontend.

## Admin role & customer database

The registration flow now creates a Firestore document at `users/{uid}` using the requested structure:

- `name`
- `email`
- `phone_number`
- `address`
- `province`
- `city`
- `subdistrict`
- `profilce_picture`
- `role`
- `fcm_token`
- `balance`
- `longlat`
- `status`

New registrations default to `role: "customer"`, `balance: 0`, `status: "active"`, and an empty `fcm_token`. `longlat` is stored as an object with `latitude` and `longitude` when the customer chooses to use GPS; otherwise it is `null`.

### Create the first admin

1. Register a normal account through `/login?mode=register`.
2. In Firebase Console → Firestore Database → `users`, open that account's document using its Firebase Authentication UID as the document ID.
3. Change only `role` from `customer` to `admin`.
4. Keep `balance` numeric and keep the other profile fields intact.
5. Sign out and sign in again. The account will be routed automatically to `/admin`.

Do not put an admin password or service-account key in the frontend or repository. The admin dashboard checks the Firestore profile role and the Firestore rules enforce admin access.

### Admin dashboard

The `/admin` page provides:

- Total customer
- Total teknisi
- Total laporan
- Laporan berjalan
- Customer active
- Total balance customer
- Completed reports
- Realtime customer table with search
- Realtime reports table

### Image refresh

The landing page now uses the supplied NyalaLagi work photos for the hero, about highlight, and four service cards. Portfolio cards use different images so the same photo is not repeated across the visible landing-page photo slots.


## Development stages
- Stage 1 — Security hardening
- Stage 2 — Technician workflow
- Stage 3 — GPS live tracking
- Stage 4 — Job evidence & customer confirmation
