import {
  addDoc, collection, serverTimestamp
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

  const reportRef = await addDoc(collection(db, "reports"), {
    customerId: params.uid,
    customerName: params.name,
    customerPhone: params.phone,
    problemType: params.problemType,
    description: params.description,
    location: params.location,
    status: "SEARCHING_ENGINEER",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    photoUrls: []
  });

  const urls: string[] = [];
  for (let i = 0; i < params.photos.length; i++) {
    const file = params.photos[i];
    const path = `reports/${reportRef.id}/${Date.now()}-${i}-${file.name}`;
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file, { contentType: file.type });
    urls.push(await getDownloadURL(storageRef));
  }

  const { updateDoc, doc } = await import("firebase/firestore");
  await updateDoc(doc(db, "reports", reportRef.id), {
    photoUrls: urls,
    updatedAt: serverTimestamp()
  });

  return reportRef.id;
}
