/* NyalaLagi Stage 9 PWA Service Worker — generated at build time. */
importScripts("https://www.gstatic.com/firebasejs/12.0.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/12.0.0/firebase-messaging-compat.js");

const VERSION = "local-1789382894336";
const CACHE_PREFIX = "nyalalagi";
const SHELL_CACHE = `${CACHE_PREFIX}-shell-${VERSION}`;
const STATIC_CACHE = `${CACHE_PREFIX}-static-${VERSION}`;
const IMAGE_CACHE = `${CACHE_PREFIX}-images-${VERSION}`;
const ALL_CACHES = [SHELL_CACHE, STATIC_CACHE, IMAGE_CACHE];

const OFFLINE_URL = "/offline.html";
const APP_SHELL = [
  "/",
  OFFLINE_URL,
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/maskable-192.png",
  "/icons/maskable-512.png",
  "/icons/apple-touch-icon.png",
  "/company/logo.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then(async (cache) => {
      await Promise.allSettled(APP_SHELL.map((url) => cache.add(url)));
    })
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys
        .filter((key) => key.startsWith(`${CACHE_PREFIX}-`) && !ALL_CACHES.includes(key))
        .map((key) => caches.delete(key))
    );
    if (self.registration.navigationPreload) {
      try { await self.registration.navigationPreload.enable(); } catch {}
    }
    await self.clients.claim();
  })());
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});

async function cachePut(cacheName, request, response) {
  if (!response || (!response.ok && response.type !== "opaque")) return response;
  const cache = await caches.open(cacheName);
  await cache.put(request, response.clone());
  return response;
}

async function networkFirstNavigation(event) {
  const request = event.request;
  try {
    const preload = await event.preloadResponse;
    if (preload) {
      if (new URL(request.url).pathname === "/") {
        await cachePut(SHELL_CACHE, request, preload);
      }
      return preload;
    }

    const response = await fetch(request);
    // Only cache the public landing document. Authenticated/customer documents
    // are intentionally not persisted to avoid showing stale private content.
    if (new URL(request.url).pathname === "/") {
      await cachePut(SHELL_CACHE, request, response);
    }
    return response;
  } catch {
    const url = new URL(request.url);
    if (url.pathname === "/") {
      const landing = await caches.match("/");
      if (landing) return landing;
    }
    return (await caches.match(OFFLINE_URL)) || new Response("Offline", {
      status: 503,
      headers: { "Content-Type": "text/plain; charset=utf-8" }
    });
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  await cachePut(STATIC_CACHE, request, response);
  return response;
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const network = fetch(request)
    .then(async (response) => {
      if (response && (response.ok || response.type === "opaque")) {
        await cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => undefined);

  if (cached) {
    void network;
    return cached;
  }

  const response = await network;
  return response || new Response("", { status: 504, statusText: "Offline" });
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname === "/sw.js") return;

  if (request.mode === "navigate") {
    event.respondWith(networkFirstNavigation(event));
    return;
  }

  if (url.pathname.startsWith("/_next/static/") || ["script", "style", "font", "worker"].includes(request.destination)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  if (request.destination === "image" || url.pathname.startsWith("/_next/image")) {
    event.respondWith(staleWhileRevalidate(request, IMAGE_CACHE));
    return;
  }

  if (url.pathname === "/manifest.webmanifest" || url.pathname.startsWith("/icons/") || url.pathname.startsWith("/company/")) {
    event.respondWith(staleWhileRevalidate(request, STATIC_CACHE));
  }
});

const firebaseConfig = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: ""
};

const hasFirebaseConfig = Object.values(firebaseConfig).every(Boolean);
if (hasFirebaseConfig) {
  try {
    firebase.initializeApp(firebaseConfig);
    const messaging = firebase.messaging();

    messaging.onBackgroundMessage((payload) => {
      const title = payload.notification?.title || payload.data?.title || "NyalaLagi";
      const body = payload.notification?.body || payload.data?.body || "Ada pembaruan laporan Anda.";
      const reportId = payload.data?.reportId || "";
      self.registration.showNotification(title, {
        body,
        icon: "/icons/icon-192.png",
        badge: "/icons/badge-96.png",
        tag: reportId ? `nyalalagi-${reportId}` : "nyalalagi",
        renotify: Boolean(reportId),
        data: { url: reportId ? `/laporan#${reportId}` : "/laporan" }
      });
    });
  } catch (error) {
    console.warn("NyalaLagi FCM service worker init failed:", error);
  }
}

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = new URL(event.notification.data?.url || "/laporan", self.location.origin).href;
  event.waitUntil((async () => {
    const clientList = await clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const client of clientList) {
      if (client.url.startsWith(self.location.origin) && "focus" in client) {
        if ("navigate" in client) await client.navigate(target);
        return client.focus();
      }
    }
    return clients.openWindow(target);
  })());
});
