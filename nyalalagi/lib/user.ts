import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import type { User } from "firebase/auth";
import { db, storage } from "./firebase";

export type UserProfile = {
  name: string;
  email: string;
  phone_number: string;
  address: string;
  province: string;
  city: string;
  subdistrict: string;
  profilce_picture: string;
  role: "customer" | "admin" | "technician" | string;
  fcm_token: string;
  balance: number;
  longlat: { latitude: number; longitude: number } | null;
  status: "active" | "inactive" | "blocked" | string;
  createdAt?: unknown;
  updatedAt?: unknown;
};

export async function getUserProfile(uid: string) {
  if (!db) throw new Error("Firebase Firestore belum dikonfigurasi.");
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? (snap.data() as UserProfile) : null;
}

export async function createCustomerProfile(user: User, data: {
  name: string;
  phone_number: string;
  address: string;
  province: string;
  city: string;
  subdistrict: string;
  profilce_picture?: File | null;
  longlat?: { latitude: number; longitude: number } | null;
}) {
  if (!db) throw new Error("Firebase Firestore belum dikonfigurasi.");

  let profilePicture = "";
  if (data.profilce_picture && storage) {
    const safeName = data.profilce_picture.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const fileRef = ref(storage, `profiles/${user.uid}/${Date.now()}-${safeName}`);
    await uploadBytes(fileRef, data.profilce_picture, { contentType: data.profilce_picture.type });
    profilePicture = await getDownloadURL(fileRef);
  }

  const profile: UserProfile = {
    name: data.name.trim(),
    email: (user.email || "").trim(),
    phone_number: data.phone_number.trim(),
    address: data.address.trim(),
    province: data.province.trim(),
    city: data.city.trim(),
    subdistrict: data.subdistrict.trim(),
    profilce_picture: profilePicture,
    role: "customer",
    fcm_token: "",
    balance: 0,
    longlat: data.longlat ?? null,
    status: "active"
  };

  await setDoc(doc(db, "users", user.uid), {
    ...profile,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  return profile;
}

export async function ensureCustomerProfile(user: User) {
  if (!db) return null;
  const existing = await getUserProfile(user.uid);
  if (existing) return existing;
  return createCustomerProfile(user, {
    name: user.displayName || "",
    phone_number: "",
    address: "",
    province: "",
    city: "",
    subdistrict: "",
    longlat: null
  });
}
