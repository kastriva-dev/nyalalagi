import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
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
  rating: number;
  customerNote: string;
}) {
  if (!db) throw new Error("Firebase Firestore belum dikonfigurasi.");
  if (params.rating < 1 || params.rating > 5) throw new Error("Rating harus 1 sampai 5.");
  await updateDoc(doc(db, "reports", params.reportId), {
    customerConfirmed: true,
    customerConfirmedAt: serverTimestamp(),
    customerRating: Math.round(params.rating),
    customerNote: params.customerNote.trim(),
    updatedAt: serverTimestamp()
  });
}
