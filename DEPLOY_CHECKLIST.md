# Production checklist

- [ ] Use the real NyalaLagi Firebase project.
- [ ] Confirm existing Engineer app Firestore schema before enabling production writes.
- [ ] Enable Anonymous Auth or replace it with NyalaLagi's actual customer authentication.
- [ ] Confirm engineer/admin custom claims.
- [ ] Test Firestore rules in Firebase Emulator/Rules Playground.
- [ ] Test photo upload size/type limits.
- [ ] Add real Firebase Cloud Messaging integration if customer notifications are required.
- [ ] Add the existing NyalaLagi Engineer assignment/notification contract.
- [ ] Add privacy policy/terms links approved by NyalaLagi.
- [ ] Add `nyalalagi.com` to Firebase Auth authorized domains if required by the chosen auth flow.
- [ ] Add Vercel environment variables.
- [ ] Test installability on Android Chrome.
- [ ] Test GPS permission on HTTPS.
- [ ] Test camera upload on Android.
- [ ] Test on slow network and mobile data.
