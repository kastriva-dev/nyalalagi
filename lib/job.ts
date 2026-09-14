import { collection, doc, runTransaction, serverTimestamp, updateDoc } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { db, storage } from "./firebase";

export type JobPhotoKind = "before" | "after";

function safeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export async function uploadJobPhotos(params: {
  reportId: string;
  kind: JobPhotoKind;
  photos: File[];
  existingUrls?: string[];
}) {
  if (!db || !storage) throw new Error("Firebase belum dikonfigurasi.");
  if (!params.photos.length) return params.existingUrls || [];
  if (params.photos.length + (params.existingUrls?.length || 0) > 8) {
    throw new Error("Maksimal 8 foto untuk tahap ini.");
  }

  const urls = [...(params.existingUrls || [])];
  for (let i = 0; i < params.photos.length; i++) {
    const file = params.photos[i];
    if (!file.type.startsWith("image/")) throw new Error("Semua file harus berupa gambar.");
    if (file.size >= 10 * 1024 * 1024) throw new Error("Ukuran setiap foto maksimal 10 MB.");
    const path = `reports/${params.reportId}/${params.kind}/${Date.now()}-${i}-${safeFileName(file.name)}`;
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file, { contentType: file.type });
    urls.push(await getDownloadURL(storageRef));
  }
  return urls;
}

export async function saveJobPhotos(params: {
  reportId: string;
  kind: JobPhotoKind;
  urls: string[];
}) {
  if (!db) throw new Error("Firebase Firestore belum dikonfigurasi.");
  await updateDoc(doc(db, "reports", params.reportId), {
    [params.kind === "before" ? "beforePhotoUrls" : "afterPhotoUrls"]: params.urls,
    updatedAt: serverTimestamp()
  });
}

export async function completeJob(params: {
  reportId: string;
  currentStatus: string;
  afterPhotoUrls: string[];
  completionNote: string;
}) {
  if (!db) throw new Error("Firebase Firestore belum dikonfigurasi.");
  if (params.currentStatus !== "IN_PROGRESS") throw new Error("Pekerjaan belum berada pada tahap pengerjaan.");
  if (!params.afterPhotoUrls.length) throw new Error("Minimal 1 foto sesudah perbaikan wajib diunggah.");
  if (!params.completionNote.trim()) throw new Error("Catatan hasil pekerjaan wajib diisi.");
  await updateDoc(doc(db, "reports", params.reportId), {
    status: "COMPLETED",
    afterPhotoUrls: params.afterPhotoUrls,
    completionNote: params.completionNote.trim(),
    completedAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
}

export async function confirmJobByCustomer(params: {
  reportId: string;
  customerId: string;
  customerName: string;
  technicianId: string;
  rating: number;
  customerNote: string;
}) {
  if (!db) throw new Error("Firebase Firestore belum dikonfigurasi.");
  const roundedRating = Math.round(params.rating);
  if (roundedRating < 1 || roundedRating > 5) throw new Error("Rating harus 1 sampai 5.");
  if (!params.technicianId) throw new Error("Teknisi pada laporan tidak ditemukan.");

  const reportRef = doc(db, "reports", params.reportId);
  const reviewRef = doc(collection(db, "technicianReviews"), params.reportId);

  // Confirmation + review are atomic. The review ID equals the report ID,
  // which also guarantees one customer review per completed report.
  await runTransaction(db, async transaction => {
    const reportSnap = await transaction.get(reportRef);
    if (!reportSnap.exists()) throw new Error("Laporan tidak ditemukan.");
    const report = reportSnap.data();
    if (report.customerId !== params.customerId) throw new Error("Anda tidak memiliki akses ke laporan ini.");
    if (report.status !== "COMPLETED") throw new Error("Pekerjaan belum selesai.");
    if (report.customerConfirmed === true) throw new Error("Laporan ini sudah diberi penilaian.");
    if (report.technicianId !== params.technicianId) throw new Error("Teknisi laporan tidak sesuai.");

    transaction.set(reviewRef, {
      reportId: params.reportId,
      customerId: params.customerId,
      customerName: params.customerName.trim() || "Pelanggan NyalaLagi",
      technicianId: params.technicianId,
      rating: roundedRating,
      comment: params.customerNote.trim(),
      createdAt: serverTimestamp()
    });

    transaction.update(reportRef, {
      customerConfirmed: true,
      customerConfirmedAt: serverTimestamp(),
      customerRating: roundedRating,
      customerNote: params.customerNote.trim(),
      updatedAt: serverTimestamp()
    });
  });
}
