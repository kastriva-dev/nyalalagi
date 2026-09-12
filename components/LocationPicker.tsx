 "use client";

import { useEffect, useRef } from "react";
import { LocateFixed, MapPin } from "lucide-react";

type Props = {
  latitude: number | null;
  longitude: number | null;
  onChange: (lat: number, lng: number, accuracy?: number) => void;
};

export default function LocationPicker({ latitude, longitude, onChange }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapObj = useRef<any>(null);
  const marker = useRef<any>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const L = await import("leaflet");
      if (!mounted || !mapRef.current) return;
      const initial: [number, number] = [
        latitude ?? -6.732,
        longitude ?? 108.552
      ];
      const map = L.map(mapRef.current).setView(initial, latitude ? 16 : 10);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors"
      }).addTo(map);
      map.on("click", (e: any) => onChange(e.latlng.lat, e.latlng.lng));
      mapObj.current = map;
      if (latitude && longitude) {
        marker.current = L.circleMarker([latitude, longitude], {
          radius: 10, color: "#20194c", fillColor: "#ffd21a", fillOpacity: 1, weight: 3
        }).addTo(map);
      }
    })();
    return () => {
      mounted = false;
      mapObj.current?.remove();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!mapObj.current || latitude == null || longitude == null) return;
    import("leaflet").then((L) => {
      const pos: [number, number] = [latitude, longitude];
      mapObj.current.setView(pos, 17);
      if (marker.current) marker.current.setLatLng(pos);
      else {
        marker.current = L.circleMarker(pos, {
          radius: 10, color: "#20194c", fillColor: "#ffd21a", fillOpacity: 1, weight: 3
        }).addTo(mapObj.current);
      }
    });
  }, [latitude, longitude]);

  function useMyLocation() {
    if (!navigator.geolocation) {
      alert("Browser ini tidak mendukung lokasi.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (p) => onChange(p.coords.latitude, p.coords.longitude, p.coords.accuracy),
      () => alert("Lokasi tidak dapat diakses. Pastikan izin lokasi diberikan."),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }

  return (
    <div>
      <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
        <button type="button" className="btn btn-primary" onClick={useMyLocation}>
          <LocateFixed size={18}/> Gunakan lokasi saya
        </button>
        <span className="muted" style={{display:"inline-flex",alignItems:"center",fontSize:13}}>
          <MapPin size={16} style={{marginRight:5}}/> Anda juga dapat memilih titik langsung di peta.
        </span>
      </div>
      <div ref={mapRef} className="map" />
      {latitude != null && longitude != null && (
        <div className="location-box">
          <b>Lokasi terpilih</b>
          <div className="muted" style={{fontSize:13,marginTop:4}}>
            {latitude.toFixed(6)}, {longitude.toFixed(6)}
          </div>
        </div>
      )}
    </div>
  );
}
