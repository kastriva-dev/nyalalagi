# Admin Console — Modul Operasional Tambahan

Admin Console now includes service catalogue, banks, regional areas, subdistricts, billing settings, transaction and income views, technician wallet balances/history, top-up review, and customer reviews.

## Firestore data

- `products`: `name`, `description`, `price`, `people`, and `active`. Active product names are offered on the customer report form; built-in problem choices remain as fallback.
- `banks`: `name`, `accountNumber`, `accountName`, and `active`.
- `provinces`: `name`.
- `cities`: `name` and `province`.
- `subdistricts`: `name`, `city`, and optional `province`.
- `settings/billing`: `discountPercent`, `serviceFeePercent`, `userAdminFee`, `technicianLimit`, and `transportFee`.
- `topups`: pending transfer records with `technicianId` (or `userId` / `uid`), a positive integer `amount` (or `totalAmount`, `total`, or `nominal`), a pending status, and optional bank and proof fields.
- `walletTransactions`: server-created ledger entries. Clients cannot create or change these records.

Transaction and income views use the latest 100 documents from `reports`. Income includes completed reports only and counts a nominal field only when one exists. This is not a payment settlement ledger.

Wallet balances are read from `users/{technicianId}.balance`. The top-up review callable validates the admin role and technician, then atomically changes the top-up status, balance, and ledger. Repeated calls do not apply the same top-up twice.

## Demo mode and migration

Each added Admin Console module has a **Lihat mode demo** switch with synthetic sample data. In demo mode, create, edit, delete, and top-up review actions are kept in this browser's local storage and do not write to Firestore. **Reset contoh** restores that module's sample records. Exiting demo mode returns to live Firebase data; demo records are never synchronized.

The old hosted admin database is separate from this repository's Firebase collections. Its records will not appear automatically, and they do not need to be synchronized for the feature demonstration. Migrate the old catalogue, bank, location, transaction, and wallet data when that work is scheduled. Demo records are synthetic and must not be treated as production records.

## Deployment

Deploy the updated Firestore rules and Cloud Functions before enabling live top-up confirmation:

```sh
firebase deploy --only firestore:rules,functions
```

Do not migrate bank-account or payment data into a public collection.
