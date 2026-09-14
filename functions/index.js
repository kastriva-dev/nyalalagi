const { initializeApp } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { getMessaging } = require("firebase-admin/messaging");
const { onDocumentCreated, onDocumentUpdated } = require("firebase-functions/v2/firestore");

initializeApp();

const db = getFirestore();

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
