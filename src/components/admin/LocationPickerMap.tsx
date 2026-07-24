"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const pinIcon = L.divIcon({
  className: "nua-pick-pin",
  html: `<span style="display:block;width:22px;height:22px;border-radius:50% 50% 50% 0;background:#455021;transform:rotate(-45deg);border:2px solid #e2e6d5;box-shadow:0 4px 10px rgba(36,41,15,.5)"></span>`,
  iconSize: [22, 22],
  iconAnchor: [11, 22],
});

type LatLng = [number, number];

function ClickToPlace({ onChange }: { onChange: (c: LatLng) => void }) {
  useMapEvents({
    click(e) {
      onChange([e.latlng.lat, e.latlng.lng]);
    },
  });
  return null;
}

function Recenter({ coords }: { coords?: LatLng }) {
  const map = useMap();
  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 200);
    return () => clearTimeout(t);
  }, [map]);
  useEffect(() => {
    if (coords) map.setView(coords, Math.max(map.getZoom(), 15));
  }, [map, coords]);
  return null;
}

export default function LocationPickerMap({
  coords,
  onChange,
}: {
  coords?: LatLng;
  onChange: (c: LatLng) => void;
}) {
  const center: LatLng = coords ?? [-34.6176, -68.3319];

  return (
    <MapContainer
      center={center}
      zoom={coords ? 15 : 12}
      scrollWheelZoom={false}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; OpenStreetMap &copy; CARTO'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
      />
      <ClickToPlace onChange={onChange} />
      <Recenter coords={coords} />
      {coords && (
        <Marker
          position={coords}
          icon={pinIcon}
          draggable
          eventHandlers={{
            dragend: (e) => {
              const ll = (e.target as L.Marker).getLatLng();
              onChange([ll.lat, ll.lng]);
            },
          }}
        />
      )}
    </MapContainer>
  );
}
