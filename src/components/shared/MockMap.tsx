import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  label: string;
  type: "client" | "provider" | "job" | "user";
  detail?: string;
  moving?: boolean;
}

interface MockMapProps {
  markers: MapMarker[];
  center?: [number, number];
  zoom?: number;
  className?: string;
  onMarkerClick?: (marker: MapMarker) => void;
  animateMarker?: string; // id of marker to animate
}

const markerColors: Record<string, string> = {
  client: "#D4A24C",
  provider: "#3B82F6",
  job: "#EF4444",
  user: "#22C55E",
};

const createIcon = (type: string) =>
  L.divIcon({
    className: "",
    html: `<div style="
      width: 36px; height: 36px; border-radius: 50%;
      background: ${markerColors[type] || "#D4A24C"};
      border: 3px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.4);
      display: flex; align-items: center; justify-content: center;
      ${type === "user" ? "animation: pulse 2s infinite;" : ""}
    ">
      <div style="width: 10px; height: 10px; border-radius: 50%; background: white;"></div>
    </div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });

const MockMap = ({ markers, center = [40.7128, -74.006], zoom = 13, className = "", onMarkerClick, animateMarker }: MockMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markersRef = useRef<Record<string, L.Marker>>({});

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    mapInstance.current = L.map(mapRef.current, {
      zoomControl: false,
      attributionControl: false,
    }).setView(center, zoom);

    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      maxZoom: 19,
    }).addTo(mapInstance.current);

    // Add zoom control to bottom right
    L.control.zoom({ position: "bottomright" }).addTo(mapInstance.current);

    return () => {
      mapInstance.current?.remove();
      mapInstance.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapInstance.current) return;

    // Clear old markers
    Object.values(markersRef.current).forEach((m) => m.remove());
    markersRef.current = {};

    markers.forEach((m) => {
      const marker = L.marker([m.lat, m.lng], { icon: createIcon(m.type) })
        .addTo(mapInstance.current!)
        .bindPopup(
          `<div style="font-family: 'Inter', sans-serif; padding: 4px;">
            <strong style="font-size: 13px;">${m.label}</strong>
            ${m.detail ? `<br/><span style="font-size: 11px; color: #888;">${m.detail}</span>` : ""}
          </div>`
        );

      if (onMarkerClick) {
        marker.on("click", () => onMarkerClick(m));
      }

      markersRef.current[m.id] = marker;
    });
  }, [markers]);

  // Animate a marker moving
  useEffect(() => {
    if (!animateMarker || !markersRef.current[animateMarker] || !mapInstance.current) return;

    const marker = markersRef.current[animateMarker];
    const pos = marker.getLatLng();
    let step = 0;

    const interval = setInterval(() => {
      step++;
      const newLat = pos.lat + step * 0.0003;
      const newLng = pos.lng - step * 0.0002;
      marker.setLatLng([newLat, newLng]);
      if (step > 30) clearInterval(interval);
    }, 1000);

    return () => clearInterval(interval);
  }, [animateMarker]);

  return <div ref={mapRef} className={`w-full ${className}`} />;
};

export default MockMap;
