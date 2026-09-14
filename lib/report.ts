import {
  addDoc, collection, doc, serverTimestamp, updateDoc
} from "firebase/firestore";
import {
  ref, uploadBytes, getDownloadURL
} from "firebase/storage";
import { db, storage } from "./firebase";

export type LocationData = {
  latitude: number;
  longitude: number;
  accuracy?: number;
  capturedAt: string;
  address?: string;
};

export type ReportStatus =
  | "SEARCHING_ENGINEER"
  | "ENGINEER_ASSIGNED"
  | "ENGINEER_ON_WAY"
  | "ARRIVED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED"
  | "REJECTED";

export async function createReport(params: {
  uid: string;
  name: string;
  phone: string;
  problemType: string;
  description: string;
  location: LocationData;
  photos: File[];
}) {
  if (!db || !storage) throw new Error("Firebase belum dikonfigurasi.");

  // Create the report first so Storage Rules can bind every upload to this report.
  const reportRef = await addDoc(collection(db, "reports"), {
    customerId: params.uid,
    customerName: params.name.trim(),
    customerPhone: params.phone.trim(),
    problemType: params.problemType,
    description: params.description.trim(),
    location: params.location,
    status: "SEARCHING_ENGINEER" as ReportStatus,
    technicianId: null,
    technicianName: null,
    technicianPhone: null,
    assignedAt: null,
    acceptedAt: null,
    onTheWayAt: null,
    arrivedAt: null,
    startedAt: null,
    completedAt: null,
    cancelledAt: null,
    photoUrls: [],
    beforePhotoUrls: [],
    afterPhotoUrls: [],
    completionNote: "",
    customerConfirmed: false,
    customerConfirmedAt: null,
    customerRating: null,
    customerNote: "",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });

  const urls: string[] = [];
  try {
    for (let i = 0; i < params.photos.length; i++) {
      const file = params.photos[i];
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `reports/${reportRef.id}/${Date.now()}-${i}-${safeName}`;
      const storageRef = ref(storage, path);
      await uploadBytes(storageRef, file, { contentType: file.type });
      urls.push(await getDownloadURL(storageRef));
    }

    await updateDoc(reportRef, {
      photoUrls: urls,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    // The report remains owned by the customer so an upload failure cannot
    // bypass Firestore Rules by changing its status client-side.
    throw error;
  }

  return reportRef.id;
}

export async function assignTechnician(params: {
  reportId: string;
  technicianId: string;
  technicianName: string;
  technicianPhone?: string;
}) {
  if (!db) throw new Error("Firebase Firestore belum dikonfigurasi.");
  await updateDoc(doc(db, "reports", params.reportId), {
    technicianId: params.technicianId,
    technicianName: params.technicianName,
    technicianPhone: params.technicianPhone || "",
    status: "ENGINEER_ASSIGNED" as ReportStatus,
    assignedAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
}
