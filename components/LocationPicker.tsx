"use client";

import { useEffect, useRef, useState } from "react";
import { LocateFixed, MapPin, Loader2 } from "lucide-react";

type Props = {
  onLocationChange?: (location: { lat: number; lng: number }) => void;
  currentLocation?: { lat: number; lng: number } | null;
};

export default function LocationPicker({ onLocationChange, currentLocation }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapObj = useRef<any>(null);
  const marker = useRef<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(currentLocation || null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        // Dynamic import leaflet
        const L = (await import("leaflet")).default;

        if (!mapRef.current || !mounted) return;

        // Initialize map
        const map = L.map(mapRef.current).setView([-6.2088, 106.8456], 13);

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 19,
        }).addTo(map);

        mapObj.current = map;

        // Set initial marker
        if (location) {
          marker.current = L.marker([location.lat, location.lng]).addTo(map);
          map.setView([location.lat, location.lng], 15);
        } else {
          // Try to get user location
          if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
              (position) => {
                if (!mounted) return;
                const { latitude, longitude } = position.coords;
                const newLoc = { lat: latitude, lng: longitude };
                setLocation(newLoc);
                if (onLocationChange) onLocationChange(newLoc);

                marker.current = L.marker([latitude, longitude]).addTo(map);
                map.setView([latitude, longitude], 15);
              },
              () => {
                // Default ke Jakarta jika geolocation gagal
                const defaultLoc = { lat: -6.2088, lng: 106.8456 };
                setLocation(defaultLoc);
                marker.current = L.marker([-6.2088, 106.8456]).addTo(map);
              }
            );
          }
        }

        // Handle map click
        map.on("click", (e: any) => {
          if (!mounted) return;
          const { lat, lng } = e.latlng;
          const newLoc = { lat, lng };
          setLocation(newLoc);
          if (onLocationChange) onLocationChange(newLoc);

          if (marker.current) {
            marker.current.setLatLng([lat, lng]);
          } else {
            marker.current = L.marker([lat, lng]).addTo(map);
          }
        });

        setLoading(false);
      } catch (err: any) {
        if (mounted) {
          setError(err.message || "Failed to load map");
          setLoading(false);
        }
      }
    })();

    return () => {
      mounted = false;
      if (mapObj.current) {
        mapObj.current.remove();
      }
    };
  }, []);

  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      setLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const newLoc = { lat: latitude, lng: longitude };
          setLocation(newLoc);
          if (onLocationChange) onLocationChange(newLoc);

          if (mapObj.current && marker.current) {
            marker.current.setLatLng([latitude, longitude]);
            mapObj.current.setView([latitude, longitude], 15);
          }
          setLoading(false);
        },
        () => {
          setError("Tidak dapat mengakses lokasi Anda");
          setLoading(false);
        }
      );
    }
  };

  return (
    <div>
      <div
        ref={mapRef}
        style={{
          width: "100%",
          height: "400px",
          borderRadius: "var(--radius-lg)",
          border: "1px solid var(--glass-border)",
          overflow: "hidden",
          marginBottom: "var(--space-lg)",
          position: "relative",
        }}
      >
        {loading && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(10, 14, 39, 0.8)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
              borderRadius: "var(--radius-lg)",
            }}
          >
            <div className="loading">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: "var(--space-lg)" }}>
          {error}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "var(--space-lg)" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "var(--space-md)",
          }}
        >
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ fontSize: "0.875rem" }}>Latitude</label>
            <input
              type="number"
              className="form-input"
              value={location?.lat.toFixed(6) || ""}
              onChange={(e) => {
                const lat = parseFloat(e.target.value);
                if (!isNaN(lat) && location) {
                  const newLoc = { ...location, lat };
                  setLocation(newLoc);
                  if (onLocationChange) onLocationChange(newLoc);
                }
              }}
              step="0.0001"
              placeholder="-6.2088"
              readOnly
            />
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ fontSize: "0.875rem" }}>Longitude</label>
            <input
              type="number"
              className="form-input"
              value={location?.lng.toFixed(6) || ""}
              onChange={(e) => {
                const lng = parseFloat(e.target.value);
                if (!isNaN(lng) && location) {
                  const newLoc = { ...location, lng };
                  setLocation(newLoc);
                  if (onLocationChange) onLocationChange(newLoc);
                }
              }}
              step="0.0001"
              placeholder="106.8456"
              readOnly
            />
          </div>
        </div>

        <button
          type="button"
          onClick={handleUseCurrentLocation}
          className="btn btn-secondary"
          disabled={loading}
          style={{ alignSelf: "flex-end" }}
        >
          {loading ? (
            <>
              <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />
              Loading...
            </>
          ) : (
            <>
              <LocateFixed size={18} />
              Gunakan Lokasi
            </>
          )}
        </button>
      </div>

      <p style={{ fontSize: "0.875rem", color: "var(--gray-400)", marginTop: "var(--space-md)" }}>
        <MapPin size={14} style={{ display: "inline", marginRight: "var(--space-sm)" }} />
        Klik di peta untuk memilih lokasi atau gunakan tombol di atas untuk lokasi saat ini.
      </p>
    </div>
  );
}
