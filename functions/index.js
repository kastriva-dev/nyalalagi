const { initializeApp } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { getStorage } = require("firebase-admin/storage");
const { getMessaging } = require("firebase-admin/messaging");
const { onDocumentCreated, onDocumentUpdated } = require("firebase-functions/v2/firestore");
const { onCall, HttpsError } = require("firebase-functions/v2/https");

initializeApp();

const db = getFirestore();

// Technician-submitted wallet top-ups are created only after the server checks
// the technician, active destination account and uploaded private receipt.

// Allocate a short, daily sequential display code for the signed-in technician.
// The UID remains the Firestore document key and continues to back all relationships.
exports.allocateTechnicianCode = onCall(async request => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError("unauthenticated", "Silakan masuk kembali.");
  const userRef = db.collection("users").doc(uid);
  const assignmentRef = db.collection("technicianCodeAssignments").doc(uid);
  const dateKey = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Jakarta", day: "2-digit", month: "2-digit", year: "2-digit"
  }).format(new Date()).replaceAll("/", "");
  const counterRef = db.collection("technicianCodeCounters").doc(dateKey);

  const technicianCode = await db.runTransaction(async transaction => {
    const user = await transaction.get(userRef);
    const assignment = await transaction.get(assignmentRef);
    if (user.exists && user.data()?.role !== "technician") {
      throw new HttpsError("permission-denied", "Akun ini bukan akun teknisi.");
    }
    const currentCode = String(user.data()?.technicianCode || assignment.data()?.technicianCode || "").trim();
    if (currentCode) {
      if (user.exists && !user.data()?.technicianCode) {
        transaction.update(userRef, { technicianCode: currentCode, updatedAt: FieldValue.serverTimestamp() });
      }
      if (!assignment.exists) {
        transaction.set(assignmentRef, { technicianCode: currentCode, assignedAt: FieldValue.serverTimestamp() });
      }
      return currentCode;
    }

    const counter = await transaction.get(counterRef);
    const next = Number(counter.data()?.sequence || 0) + 1;
    const allocatedCode = `Tek-${String(next).padStart(2, "0")}${dateKey}`;
    transaction.set(counterRef, { sequence: next, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    transaction.set(assignmentRef, { technicianCode: allocatedCode, assignedAt: FieldValue.serverTimestamp() });
    if (user.exists) transaction.update(userRef, { technicianCode: allocatedCode, updatedAt: FieldValue.serverTimestamp() });
    return allocatedCode;
  });
  return { technicianCode };
});
exports.submitTechnicianTopup = onCall(async request => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError("unauthenticated", "Silakan masuk kembali.");

  const topupId = String(request.data?.topupId || "").trim();
  const amount = Number(request.data?.amount);
  const sourceType = String(request.data?.sourceType || "").trim().toLowerCase();
  const sourceName = String(request.data?.sourceName || "").trim();
  const transferDate = String(request.data?.transferDate || "").trim();
  const transferTime = String(request.data?.transferTime || "").trim();
  const bankId = String(request.data?.bankId || "").trim();
  const proofPath = String(request.data?.proofPath || "").trim();

  if (!/^[A-Za-z0-9_-]{12,80}$/.test(topupId)) {
    throw new HttpsError("invalid-argument", "Nomor pengajuan tidak valid.");
  }
  if (!Number.isSafeInteger(amount) || amount < 10000 || amount > 100000000) {
    throw new HttpsError("invalid-argument", "Nominal top-up harus Rp10.000–Rp100.000.000.");
  }
  if (!["bank", "ewallet"].includes(sourceType) || sourceName.length < 2 || sourceName.length > 80) {
    throw new HttpsError("invalid-argument", "Asal bank atau e-wallet tidak valid.");
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(transferDate) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(transferTime)) {
    throw new HttpsError("invalid-argument", "Tanggal atau waktu transfer tidak valid.");
  }
  const normalizedDate = new Date(`${transferDate}T00:00:00.000Z`);
  if (Number.isNaN(normalizedDate.getTime()) || normalizedDate.toISOString().slice(0, 10) !== transferDate) {
    throw new HttpsError("invalid-argument", "Tanggal transfer tidak valid.");
  }
  const parsedTransferAt = new Date(`${transferDate}T${transferTime}:00+07:00`);
  if (Number.isNaN(parsedTransferAt.getTime()) || parsedTransferAt.getTime() > Date.now() + 5 * 60 * 1000) {
    throw new HttpsError("invalid-argument", "Waktu transfer tidak boleh di masa depan.");
  }
  const allowedProofPath = new RegExp(`^wallet-topups/${uid}/${topupId}\\.(jpg|jpeg|png|webp)$`, "i");
  if (!allowedProofPath.test(proofPath)) {
    throw new HttpsError("invalid-argument", "Lokasi bukti transfer tidak valid.");
  }

  const [technicianSnap, bankSnap] = await Promise.all([
    db.collection("users").doc(uid).get(),
    db.collection("banks").doc(bankId).get()
  ]);
  const technician = technicianSnap.data();
  const bank = bankSnap.data();
  if (!technicianSnap.exists || technician?.role !== "technician" || technician?.status !== "active") {
    throw new HttpsError("permission-denied", "Top-up hanya tersedia untuk teknisi aktif.");
  }
  if (!bankSnap.exists || bank?.active !== true || !bank?.name || !bank?.accountNumber || !bank?.accountName) {
    throw new HttpsError("failed-precondition", "Rekening tujuan tidak aktif atau tidak lengkap.");
  }

  const receipt = getStorage().bucket().file(proofPath);
  const [receiptExists] = await receipt.exists();
  if (!receiptExists) throw new HttpsError("failed-precondition", "Bukti transfer belum berhasil diunggah.");
  const [metadata] = await receipt.getMetadata();
  const receiptSize = Number(metadata.size || 0);
  if (!String(metadata.contentType || "").startsWith("image/") || receiptSize <= 0 || receiptSize > 8 * 1024 * 1024) {
    throw new HttpsError("failed-precondition", "Bukti harus berupa gambar maksimal 8 MB.");
  }

  const topupRef = db.collection("topups").doc(topupId);
  await db.runTransaction(async transaction => {
    const existing = await transaction.get(topupRef);
    if (existing.exists) throw new HttpsError("already-exists", "Pengajuan top-up dengan nomor ini sudah ada.");
    const timestamp = FieldValue.serverTimestamp();
    transaction.create(topupRef, {
      technicianId: uid,
      technicianName: String(technician.name || "Teknisi"),
      technicianEmail: String(technician.email || ""),
      type: "Top-up",
      amount,
      sourceType,
      sourceName,
      bankId,
      bankName: String(bank.name),
      accountNumber: String(bank.accountNumber),
      accountName: String(bank.accountName),
      transferDate,
      transferTime,
      proofPath,
      status: "pending",
      createdAt: timestamp,
      updatedAt: timestamp
    });
  });

  return { topupId, status: "pending" };
});

const NOTIFICATIONS = {
  SEARCHING_ENGINEER: {
    title: "Laporan berhasil dikirim",
    body: "Laporan Anda sudah diterima. NyalaLagi sedang mencari teknisi terdekat."
  },
  ENGINEER_ASSIGNED: {
    title: "Teknisi telah ditugaskan",
    body: "Teknisi telah ditugaskan untuk menangani laporan Anda."
  },
  ENGINEER_ON_WAY: {
    title: "Teknisi sedang menuju lokasi",
    body: "Teknisi sedang dalam perjalanan menuju lokasi perbaikan."
  },
  ARRIVED: {
    title: "Teknisi telah tiba",
    body: "Teknisi sudah tiba di lokasi dan siap melakukan pemeriksaan."
  },
  IN_PROGRESS: {
    title: "Pekerjaan sedang dilakukan",
    body: "Teknisi sedang mengerjakan perbaikan pada lokasi Anda."
  },
  COMPLETED: {
    title: "Pekerjaan selesai",
    body: "Pekerjaan telah ditandai selesai. Silakan periksa hasil pekerjaan dan konfirmasi layanan."
  },
  REJECTED: {
    title: "Teknisi tidak dapat melanjutkan pekerjaan",
    body: "Teknisi menolak atau membatalkan pekerjaan ini. Admin perlu melakukan penanganan selanjutnya."
  }
};

function changedStatus(before, after) {
  return before?.status !== after?.status && Boolean(after?.status);
}

async function notifyCustomer(reportId, report) {
  const customerId = report?.customerId;
  const status = report?.status;
  const message = NOTIFICATIONS[status];

  if (!customerId || !message) return;

  const userSnap = await db.collection("users").doc(customerId).get();
  if (!userSnap.exists) return;

  const token = userSnap.data()?.fcm_token;
  if (!token || typeof token !== "string") return;

  const appUrl = process.env.APP_URL || "https://nyalalagi.com";
  const link = `${appUrl.replace(/\/$/, "")}/laporan#${reportId}`;

  try {
    const result = await getMessaging().send({
      token,
      notification: {
        title: message.title,
        body: message.body
      },
      data: {
        reportId: String(reportId),
        status: String(status),
        title: message.title,
        body: message.body
      },
      webpush: {
        fcmOptions: { link },
        notification: {
          icon: `${appUrl.replace(/\/$/, "")}/company/logo.png`,
          badge: `${appUrl.replace(/\/$/, "")}/company/logo.png`,
          tag: `nyalalagi-${reportId}`
        }
      }
    });

    console.log(`Notification sent for report ${reportId}: ${result}`);
  } catch (error) {
    // Invalid/expired tokens should not make the Firestore trigger fail.
    console.error(`Notification failed for report ${reportId}:`, error);
  }
}

exports.notifyCustomerOnReportCreated = onDocumentCreated("reports/{reportId}", async event => {
  const report = event.data?.data();
  if (!report) return;
  await notifyCustomer(event.params.reportId, report);
});

exports.notifyCustomerOnReportUpdated = onDocumentUpdated("reports/{reportId}", async event => {
  const before = event.data?.before?.data();
  const after = event.data?.after?.data();
  if (!before || !after || !changedStatus(before, after)) return;
  await notifyCustomer(event.params.reportId, after);
});


// Stage 6: every customer review is aggregated into the technician profile.
// The Admin SDK bypasses client Firestore rules, so customers cannot forge
// ratingAverage/ratingCount fields directly on a technician profile.
exports.aggregateTechnicianRating = onDocumentCreated("technicianReviews/{reviewId}", async event => {
  const review = event.data?.data();
  if (!review) return;

  const technicianId = review.technicianId;
  const rating = Number(review.rating);
  if (!technicianId || !Number.isFinite(rating) || rating < 1 || rating > 5) {
    console.error("Invalid technician review:", event.params.reviewId);
    return;
  }

  const technicianRef = db.collection("users").doc(String(technicianId));
  await db.runTransaction(async transaction => {
    const snap = await transaction.get(technicianRef);
    const current = snap.exists ? snap.data() : {};
    const count = Number(current?.ratingCount || 0);
    const sum = Number(current?.ratingSum || 0);
    const nextCount = count + 1;
    const nextSum = sum + rating;

    transaction.set(technicianRef, {
      ratingCount: nextCount,
      ratingSum: nextSum,
      ratingAverage: Number((nextSum / nextCount).toFixed(2)),
      updatedAt: FieldValue.serverTimestamp()
    }, { merge: true });
  });
});

// Admin review is the only client-facing path that can credit a technician's
// wallet. The transfer decision, balance update, top-up status and ledger entry
// commit atomically, so retries cannot credit the same top-up twice.
exports.reviewTechnicianTopup = onCall(async request => {
  if (!request.auth?.uid) throw new HttpsError("unauthenticated", "Silakan masuk kembali.");

  const topupId = String(request.data?.topupId || "").trim();
  const decision = request.data?.decision;
  if (!topupId || !["approve", "reject"].includes(decision)) {
    throw new HttpsError("invalid-argument", "Permintaan pemeriksaan top-up tidak valid.");
  }

  const adminSnap = await db.collection("users").doc(request.auth.uid).get();
  if (!adminSnap.exists || adminSnap.data()?.role !== "admin") {
    throw new HttpsError("permission-denied", "Aksi ini hanya dapat dilakukan admin.");
  }

  const topupRef = db.collection("topups").doc(topupId);
  const ledgerRef = db.collection("walletTransactions").doc(`topup_${topupId}`);
  return db.runTransaction(async transaction => {
    const topupSnap = await transaction.get(topupRef);
    if (!topupSnap.exists) throw new HttpsError("not-found", "Pengajuan top-up tidak ditemukan.");

    const topup = topupSnap.data();
    const status = String(topup.status || "").trim().toLowerCase();
    if (["approved", "confirmed", "rejected"].includes(status)) {
      return { status: "already_processed" };
    }
    if (!["pending", "on check", "on_check", "waiting", "menunggu"].includes(status)) {
      throw new HttpsError("failed-precondition", "Status pengajuan belum siap diperiksa.");
    }

    const rawAmount = topup.amount ?? topup.totalAmount ?? topup.total ?? topup.nominal;
    const amount = Number(typeof rawAmount === "string" ? rawAmount.replace(/[^0-9.-]/g, "") : rawAmount);
    const technicianId = String(topup.technicianId || topup.userId || topup.uid || "").trim();
    if (!technicianId || !Number.isSafeInteger(amount) || amount <= 0 || amount > 100000000) {
      throw new HttpsError("failed-precondition", "Data teknisi atau nominal top-up tidak valid.");
    }

    const technicianRef = db.collection("users").doc(technicianId);
    const technicianSnap = await transaction.get(technicianRef);
    if (!technicianSnap.exists || technicianSnap.data()?.role !== "technician") {
      throw new HttpsError("failed-precondition", "Akun tujuan bukan teknisi yang terdaftar.");
    }

    const timestamp = FieldValue.serverTimestamp();
    if (decision === "reject") {
      transaction.update(topupRef, {
        status: "rejected",
        reviewedBy: request.auth.uid,
        reviewedAt: timestamp,
        updatedAt: timestamp
      });
      return { status: "rejected" };
    }

    const currentBalance = Number(technicianSnap.data()?.balance || 0);
    if (!Number.isSafeInteger(currentBalance) || currentBalance < 0 || currentBalance + amount > Number.MAX_SAFE_INTEGER) {
      throw new HttpsError("failed-precondition", "Saldo teknisi saat ini tidak valid.");
    }

    transaction.update(technicianRef, {
      balance: currentBalance + amount,
      updatedAt: timestamp
    });
    transaction.update(topupRef, {
      status: "approved",
      reviewedBy: request.auth.uid,
      reviewedAt: timestamp,
      updatedAt: timestamp
    });
    transaction.create(ledgerRef, {
      type: "topup",
      topupId,
      technicianId,
      amount,
      balanceBefore: currentBalance,
      balanceAfter: currentBalance + amount,
      createdBy: request.auth.uid,
      createdAt: timestamp
    });
    return { status: "approved", balanceAfter: currentBalance + amount };
  });
});
