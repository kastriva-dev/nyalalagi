import Image from "next/image";

export default function Loading() {
  return (
    <div className="app-loading-screen" role="status" aria-live="polite">
      <div className="app-loading-mark"><Image src="/icons/icon-192.png" alt="" width={76} height={76} priority /></div>
      <strong>NyalaLagi</strong>
      <span>Memuat layanan...</span>
      <div className="app-loading-bar"><i /></div>
    </div>
  );
}
