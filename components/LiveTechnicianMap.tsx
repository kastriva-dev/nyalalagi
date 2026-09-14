"use client";

import { useEffect, useRef, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { LocateFixed, Navigation, Radio } from "lucide-react";
import { db } from "@/lib/firebase";

type Props = { reportId: string; customerId: string; destination?: { latitude: number; longitude: number } };

export default function LiveTechnicianMap({ reportId, customerId, destination }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapObj = useRef<any>(null);
  const marker = useRef<any>(null);
  const destinationMarker = useRef<any>(null);
  const [position, setPosition] = useState<{latitude:number;longitude:number;accuracy?:number;updatedAt?:any}|null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!db) return;
    const trackingRef = doc(db, "reportTracking", reportId);
    return onSnapshot(trackingRef, snap => {
      if (!snap.exists()) { setPosition(null); return; }
      const data = snap.data();
      if (data.customerId !== customerId) { setPosition(null); return; }
      setPosition({ latitude: Number(data.latitude), longitude: Number(data.longitude), accuracy: Number(data.accuracy || 0), updatedAt: data.updatedAt });
      setError("");
    }, err => setError(err.message));
  }, [reportId, customerId]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const L = await import("leaflet");
      if (!mounted || !mapRef.current) return;
      const initial: [number, number] = position ? [position.latitude, position.longitude] : destination ? [destination.latitude, destination.longitude] : [-6.732, 108.552];
      const map = L.map(mapRef.current, { zoomControl: true }).setView(initial, position ? 16 : 12);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "&copy; OpenStreetMap contributors" }).addTo(map);
      mapObj.current = map;
      if (position) {
        marker.current = L.circleMarker([position.latitude, position.longitude], { radius: 10, color: "#20194c", fillColor: "#ffd21a", fillOpacity: 1, weight: 3 }).addTo(map);
      }
      if (destination) {
        destinationMarker.current = L.circleMarker([destination.latitude, destination.longitude], { radius: 8, color: "#16a36a", fillColor: "#ffffff", fillOpacity: 1, weight: 3 }).addTo(map);
      }
      setTimeout(() => map.invalidateSize(), 80);
    })().catch(() => setError("Peta pelacakan tidak dapat dimuat."));
    return () => { mounted = false; mapObj.current?.remove(); mapObj.current = null; marker.current = null; destinationMarker.current = null; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!mapObj.current || !position) return;
    import("leaflet").then(L => {
      const pos: [number, number] = [position.latitude, position.longitude];
      mapObj.current.setView(pos, Math.max(mapObj.current.getZoom(), 16));
      if (marker.current) marker.current.setLatLng(pos);
      else marker.current = L.circleMarker(pos, { radius: 10, color: "#20194c", fillColor: "#ffd21a", fillOpacity: 1, weight: 3 }).addTo(mapObj.current);
    });
  }, [position]);

  const updatedDate = position?.updatedAt?.toDate ? position.updatedAt.toDate() : null;
  const isStale = updatedDate ? Date.now() - updatedDate.getTime() > 45000 : false;
  const updatedText = updatedDate ? updatedDate.toLocaleTimeString("id-ID", {hour:"2-digit", minute:"2-digit", second:"2-digit"}) : "baru saja";

  return <div className="tracking-card">
    <div className="tracking-head">
      <div><span className="eyebrow"><Radio size={14}/> Pelacakan realtime</span><h3 style={{margin:"10px 0 4px"}}>Teknisi sedang menuju lokasi</h3><p className="muted" style={{margin:0,fontSize:13}}>Posisi diperbarui otomatis selama teknisi dalam perjalanan.</p></div>
      {position && <span className={`live-dot ${isStale ? "is-stale" : ""}`}><span/> {isStale ? "TERAKHIR TERLIHAT" : "LIVE"}</span>}
    </div>
    <div ref={mapRef} className="map tracking-map" />
    {position ? <div className="tracking-meta"><span><LocateFixed size={15}/> Akurasi ±{Math.max(1, Math.round(position.accuracy || 0))} m</span><span>Update {updatedText}</span><a className="btn btn-secondary" target="_blank" rel="noreferrer" href={`https://www.google.com/maps/dir/?api=1&destination=${position.latitude},${position.longitude}`}><Navigation size={15}/> Navigasi</a></div> : <div className="tracking-empty">{error || "Menunggu lokasi GPS teknisi..."}</div>}
  </div>;
}
