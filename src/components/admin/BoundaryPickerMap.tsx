"use client";

import { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Polygon,
  Polyline,
  Marker,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import SatelliteTiles, { SAT_MAX_ZOOM } from "@/components/SatelliteTiles";

type LatLng = [number, number];

const BRAND = "#acb297"; // celadon-400 (verde NÚA)

/** Rectángulo aproximado (frente × fondo) desde el área, para arrancar. */
function rectFromArea(center: LatLng, areaM2: number, ratio = 0.48, angleDeg = 18): LatLng[] {
  const frontage = Math.sqrt(areaM2 * ratio);
  const depth = Math.sqrt(areaM2 / ratio);
  const [lat, lng] = center;
  const mPerDegLat = 111320;
  const mPerDegLng = 111320 * Math.cos((lat * Math.PI) / 180);
  const hw = frontage / 2;
  const hd = depth / 2;
  const a = (angleDeg * Math.PI) / 180;
  const corners: LatLng[] = [
    [-hw, -hd],
    [hw, -hd],
    [hw, hd],
    [-hw, hd],
  ];
  return corners.map(([x, y]) => {
    const xr = x * Math.cos(a) - y * Math.sin(a);
    const yr = x * Math.sin(a) + y * Math.cos(a);
    return [lat + yr / mPerDegLat, lng + xr / mPerDegLng] as LatLng;
  });
}

/** Área en m² de un polígono (fórmula del área esférica simplificada, plana local). */
function polygonArea(pts: LatLng[]): number {
  if (pts.length < 3) return 0;
  const lat0 = pts[0][0];
  const mPerDegLat = 111320;
  const mPerDegLng = 111320 * Math.cos((lat0 * Math.PI) / 180);
  const xy = pts.map(([la, ln]) => [ln * mPerDegLng, la * mPerDegLat]);
  let s = 0;
  for (let i = 0; i < xy.length; i++) {
    const [x1, y1] = xy[i];
    const [x2, y2] = xy[(i + 1) % xy.length];
    s += x1 * y2 - x2 * y1;
  }
  return Math.abs(s) / 2;
}

function vertexIcon(index: number) {
  return L.divIcon({
    className: "nua-vertex",
    html: `<span style="display:flex;align-items:center;justify-content:center;width:22px;height:22px;border-radius:50%;background:#455021;color:#e2e6d5;font:600 11px/1 system-ui;border:2px solid #fff;box-shadow:0 2px 6px rgba(36,41,15,.55);cursor:grab">${index + 1}</span>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });
}

function ClickToAdd({ onAdd }: { onAdd: (c: LatLng) => void }) {
  useMapEvents({
    click(e) {
      onAdd([e.latlng.lat, e.latlng.lng]);
    },
  });
  return null;
}

function FitOnce({ points, center }: { points: LatLng[]; center: LatLng }) {
  const map = useMap();
  useEffect(() => {
    const t = setTimeout(() => {
      map.invalidateSize({ animate: false });
      if (points.length >= 2) {
        map.fitBounds(L.latLngBounds(points.map((p) => L.latLng(p[0], p[1]))), {
          padding: [60, 60],
          maxZoom: 19,
        });
      } else {
        map.setView(center, 18);
      }
    }, 200);
    return () => clearTimeout(t);
    // solo al montar
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map]);
  return null;
}

export default function BoundaryPickerMap({
  center,
  area,
  boundary,
  onChange,
}: {
  center: LatLng;
  area?: number;
  boundary: LatLng[];
  onChange: (b: LatLng[]) => void;
}) {
  const [view, setView] = useState<"sat" | "mapa">("sat");
  const pts = boundary;

  const addVertex = (c: LatLng) => onChange([...pts, c]);
  const moveVertex = (i: number, c: LatLng) =>
    onChange(pts.map((p, idx) => (idx === i ? c : p)));
  const removeVertex = (i: number) => onChange(pts.filter((_, idx) => idx !== i));
  const undo = () => onChange(pts.slice(0, -1));
  const clear = () => onChange([]);
  const seed = () => onChange(rectFromArea(center, area && area > 0 ? area : 300));

  const drawnArea = pts.length >= 3 ? Math.round(polygonArea(pts)) : 0;

  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={center}
        zoom={18}
        maxZoom={SAT_MAX_ZOOM}
        scrollWheelZoom={false}
        style={{ height: "100%", width: "100%" }}
      >
        {view === "sat" ? (
          <SatelliteTiles />
        ) : (
          <TileLayer
            attribution="&copy; CARTO"
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            maxNativeZoom={19}
            maxZoom={SAT_MAX_ZOOM}
          />
        )}

        <ClickToAdd onAdd={addVertex} />
        <FitOnce points={pts} center={center} />

        {pts.length >= 3 && (
          <Polygon
            positions={pts}
            pathOptions={{ color: BRAND, weight: 3, fillColor: BRAND, fillOpacity: 0.28 }}
          />
        )}
        {pts.length === 2 && (
          <Polyline positions={pts} pathOptions={{ color: BRAND, weight: 3 }} />
        )}

        {pts.map((p, i) => (
          <Marker
            key={i}
            position={p}
            icon={vertexIcon(i)}
            draggable
            eventHandlers={{
              dragend: (e) => {
                const ll = (e.target as L.Marker).getLatLng();
                moveVertex(i, [ll.lat, ll.lng]);
              },
              click: () => removeVertex(i),
            }}
          />
        ))}
      </MapContainer>

      {/* Toggle satélite / mapa */}
      <div className="absolute right-3 top-3 z-[1000] flex overflow-hidden rounded-full border border-white/60 bg-white/90 text-xs font-medium shadow-md backdrop-blur">
        {(["sat", "mapa"] as const).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setView(v)}
            className={`px-3 py-1.5 transition-colors ${
              view === v ? "bg-moss-600 text-mint-100" : "text-ink-soft hover:bg-mint-100"
            }`}
          >
            {v === "sat" ? "Satélite" : "Mapa"}
          </button>
        ))}
      </div>

      {/* Controles de dibujo */}
      <div className="absolute bottom-3 left-3 z-[1000] flex flex-wrap items-center gap-2 rounded-xl border border-white/50 bg-white/92 px-3 py-2 text-xs shadow-md backdrop-blur">
        <button
          type="button"
          onClick={seed}
          className="rounded-full bg-sage-500 px-3 py-1.5 font-medium text-white hover:bg-moss-600"
        >
          ▢ Generar desde m²
        </button>
        <button
          type="button"
          onClick={undo}
          disabled={pts.length === 0}
          className="rounded-full border border-moss-600/20 px-3 py-1.5 font-medium text-ink-soft hover:bg-mint-100 disabled:opacity-40"
        >
          ↶ Deshacer
        </button>
        <button
          type="button"
          onClick={clear}
          disabled={pts.length === 0}
          className="rounded-full border border-moss-600/20 px-3 py-1.5 font-medium text-ink-soft hover:bg-mint-100 disabled:opacity-40"
        >
          ✕ Borrar
        </button>
        <span className="pl-1 text-ink-soft/70">
          {pts.length === 0
            ? "Tocá cada esquina"
            : `${pts.length} punto${pts.length > 1 ? "s" : ""}${
                drawnArea ? ` · ≈ ${drawnArea.toLocaleString("es-AR")} m²` : ""
              }`}
        </span>
      </div>
    </div>
  );
}
