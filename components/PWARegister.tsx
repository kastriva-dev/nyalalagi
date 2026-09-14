"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Download, RefreshCw, Share2, WifiOff, X } from "lucide-react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

const INSTALL_DISMISS_KEY = "nyalalagi-pwa-install-dismissed";
const INSTALL_DISMISS_MS = 7 * 24 * 60 * 60 * 1000;

function isStandalone() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true;
}

function isIOS() {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

export default function PWARegister() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstall, setShowInstall] = useState(false);
  const [showIOSHelp, setShowIOSHelp] = useState(false);
  const [showUpdate, setShowUpdate] = useState(false);
  const [online, setOnline] = useState(true);
  const [showSplash, setShowSplash] = useState(false);
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);
  const reloadOnControllerChange = useRef(false);

  useEffect(() => {
    setOnline(navigator.onLine);

    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);

    const standalone = isStandalone();
    if (standalone && sessionStorage.getItem("nyalalagi-pwa-splash") !== "1") {
      sessionStorage.setItem("nyalalagi-pwa-splash", "1");
      setShowSplash(true);
      window.setTimeout(() => setShowSplash(false), 850);
    }

    const canOfferInstall = () => {
      if (standalone) return false;
      const dismissedAt = Number(localStorage.getItem(INSTALL_DISMISS_KEY) || 0);
      return !dismissedAt || Date.now() - dismissedAt > INSTALL_DISMISS_MS;
    };

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      const installEvent = event as BeforeInstallPromptEvent;
      setDeferredPrompt(installEvent);
      if (canOfferInstall()) setShowInstall(true);
    };

    const onAppInstalled = () => {
      setDeferredPrompt(null);
      setShowInstall(false);
      setShowIOSHelp(false);
      localStorage.removeItem(INSTALL_DISMISS_KEY);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);

    if (isIOS() && canOfferInstall()) setShowInstall(true);

    let updateTimer: number | undefined;
    let removeVisibilityListener: (() => void) | undefined;

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (reloadOnControllerChange.current) window.location.reload();
      });

      navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" })
        .then((registration) => {
          registrationRef.current = registration;
          if (registration.waiting && navigator.serviceWorker.controller) setShowUpdate(true);

          registration.addEventListener("updatefound", () => {
            const worker = registration.installing;
            if (!worker) return;
            worker.addEventListener("statechange", () => {
              if (worker.state === "installed" && navigator.serviceWorker.controller) {
                setShowUpdate(true);
              }
            });
          });

          const checkForUpdate = () => {
            if (document.visibilityState === "visible") void registration.update().catch(() => undefined);
          };
          document.addEventListener("visibilitychange", checkForUpdate);
          removeVisibilityListener = () => document.removeEventListener("visibilitychange", checkForUpdate);
          updateTimer = window.setInterval(() => void registration.update().catch(() => undefined), 60 * 60 * 1000);
        })
        .catch((error) => console.warn("NyalaLagi service worker registration failed:", error));
    }

    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
      removeVisibilityListener?.();
      if (updateTimer) window.clearInterval(updateTimer);
    };
  }, []);

  async function installApp() {
    if (isIOS() && !deferredPrompt) {
      setShowIOSHelp(true);
      return;
    }
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === "accepted") setShowInstall(false);
    setDeferredPrompt(null);
  }

  function dismissInstall() {
    localStorage.setItem(INSTALL_DISMISS_KEY, String(Date.now()));
    setShowInstall(false);
    setShowIOSHelp(false);
  }

  function applyUpdate() {
    const waiting = registrationRef.current?.waiting;
    if (!waiting) {
      void registrationRef.current?.update();
      return;
    }
    reloadOnControllerChange.current = true;
    waiting.postMessage({ type: "SKIP_WAITING" });
  }

  return (
    <>
      {showSplash && (
        <div className="pwa-launch-splash" role="status" aria-label="Memuat NyalaLagi">
          <div className="pwa-launch-logo"><Image src="/icons/icon-192.png" alt="NyalaLagi" width={92} height={92} priority /></div>
          <strong>NyalaLagi</strong>
          <span>Masalah listrik? NyalaLagi yang urus.</span>
          <i aria-hidden="true" />
        </div>
      )}

      {!online && (
        <div className="pwa-network-status" role="status"><WifiOff size={15} /> Offline — data terbaru belum dapat dimuat</div>
      )}

      {showUpdate && (
        <div className="pwa-update-toast" role="status">
          <div><RefreshCw size={18} /><span><b>Versi baru tersedia</b><small>Perbarui NyalaLagi untuk mendapatkan versi terbaru.</small></span></div>
          <button type="button" onClick={applyUpdate}>Perbarui</button>
          <button type="button" className="pwa-toast-close" onClick={() => setShowUpdate(false)} aria-label="Tutup"><X size={17} /></button>
        </div>
      )}

      {showInstall && !showUpdate && (
        <div className="pwa-install-card">
          <Image src="/icons/icon-192.png" alt="" width={48} height={48} />
          <div className="pwa-install-copy"><b>Pasang NyalaLagi</b><span>Akses lebih cepat dari layar utama ponsel.</span></div>
          <button type="button" className="pwa-install-button" onClick={installApp}><Download size={15} /> Pasang</button>
          <button type="button" className="pwa-install-close" onClick={dismissInstall} aria-label="Jangan tampilkan dulu"><X size={16} /></button>
        </div>
      )}

      {showIOSHelp && (
        <div className="pwa-ios-backdrop" onClick={() => setShowIOSHelp(false)}>
          <div className="pwa-ios-sheet" role="dialog" aria-modal="true" aria-labelledby="pwa-ios-title" onClick={(event) => event.stopPropagation()}>
            <button type="button" className="pwa-ios-close" onClick={() => setShowIOSHelp(false)} aria-label="Tutup"><X size={19} /></button>
            <Image src="/icons/icon-192.png" alt="NyalaLagi" width={64} height={64} />
            <h2 id="pwa-ios-title">Pasang NyalaLagi di iPhone</h2>
            <p>Di Safari, ketuk tombol <b>Bagikan</b>, lalu pilih <b>Tambahkan ke Layar Utama</b>.</p>
            <div className="pwa-ios-step"><Share2 size={19} /> Bagikan → Tambahkan ke Layar Utama</div>
            <button type="button" className="btn btn-primary" onClick={() => setShowIOSHelp(false)}>Mengerti</button>
          </div>
        </div>
      )}
    </>
  );
}
