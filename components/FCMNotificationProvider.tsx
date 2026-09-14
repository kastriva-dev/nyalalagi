 "use client";

import { useCallback, useEffect, useState } from "react";
import { getToken, isSupported, onMessage } from "firebase/messaging";
import { doc, updateDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db, app } from "@/lib/firebase";
import { getMessaging } from "firebase/messaging";

const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || "";

export default function FCMNotificationProvider() {
  const [enabled, setEnabled] = useState(false);

  const registerNotifications = useCallback(async () => {
    if (!app || !auth || !db || !vapidKey || typeof window === "undefined") return false;

    // Keep non-null references stable across awaits/callbacks for TypeScript.
    const firebaseApp = app;
    const firebaseAuth = auth;
    const firestore = db;

    if (!("Notification" in window) || !("serviceWorker" in navigator)) return false;
    if (!(await isSupported())) return false;

    const user = firebaseAuth.currentUser;
    if (!user || user.isAnonymous) return false;

    const permission = Notification.permission === "granted"
      ? "granted"
      : await Notification.requestPermission();

    if (permission !== "granted") return false;

    const registration = await navigator.serviceWorker.ready;
    const messaging = getMessaging(firebaseApp);
    const token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: registration
    });

    if (!token) return false;

    await updateDoc(doc(firestore, "users", user.uid), {
      fcm_token: token,
      updatedAt: new Date()
    });

    setEnabled(true);
    return true;
  }, []);

  useEffect(() => {
    if (!auth || !db || !app) return;

    // Preserve the non-null Firebase instances for callbacks below.
    // TypeScript does not keep the outer null-check narrowing inside
    // asynchronous callback closures.
    const firebaseApp = app;
    const firebaseAuth = auth;

    let unsubscribeMessage: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(firebaseAuth, async (user) => {
      if (!user || user.isAnonymous) return;

      // Register automatically when the browser has already granted permission.
      if (Notification.permission === "granted") {
        try { await registerNotifications(); } catch (error) { console.warn("FCM registration:", error); }
      }

      try {
        if (await isSupported()) {
          const messaging = getMessaging(firebaseApp);
          unsubscribeMessage?.();
          unsubscribeMessage = onMessage(messaging, (payload) => {
            const title = payload.notification?.title || payload.data?.title || "NyalaLagi";
            const body = payload.notification?.body || payload.data?.body || "Ada pembaruan laporan Anda.";
            if (Notification.permission === "granted") {
              new Notification(title, {
                body,
                icon: "/company/logo.png",
                badge: "/company/logo.png",
                tag: payload.data?.reportId ? `nyalalagi-${payload.data.reportId}` : "nyalalagi"
              });
            }
          });
        }
      } catch (error) {
        console.warn("FCM foreground listener:", error);
      }
    });

    return () => {
      unsubscribeAuth();
      unsubscribeMessage?.();
    };
  }, [registerNotifications]);

  // Expose a tiny global action so the customer page can provide a clear opt-in button.
  useEffect(() => {
    (window as any).__enableNyalaLagiNotifications = async () => {
      try { return await registerNotifications(); }
      catch (error) { console.warn("FCM enable:", error); return false; }
    };
    return () => { delete (window as any).__enableNyalaLagiNotifications; };
  }, [registerNotifications]);

  void enabled;
  return null;
}
