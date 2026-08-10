"use client";

import { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Polygon,
  Polyline,
  Marker,
  Tooltip,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { LOT_STATUS_COLORS, type Lot } from "@/lib/loteos";

type LatLng = [number, number];

const EDIT = "#acb297"; // verde NÚA para el lote en edición

function rectFromArea(center: LatLng, areaM2: number, ratio = 0.55, angleDeg = 12): LatLng[] {
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

function FitOnce({ center }: { center: LatLng }) {
  const map = useMap();
  useEffect(() => {
    const t = setTimeout(() => {
      map.invalidateSize({ animate: false });
      map.setView(center, 17);
    }, 200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map]);
  return null;
}

export default function LoteoEditorMap({
  center,
  lots,
  selected,
  onSelect,
  onChangeBoundary,
}: {
  center: LatLng;
  lots: Lot[];
  selected: number | null;
  onSelect: (i: number) => void;
  onChangeBoundary: (b: LatLng[]) => void;
}) {
  const [view, setView] = useState<"sat" | "mapa">("sat");
  const current = selected != null ? lots[selected] : null;
  const pts = current?.boundary ?? [];

  const addVertex = (c: LatLng) => {
    if (!current) return;
    onChangeBoundary([...pts, c]);
  };
  const moveVertex = (i: number, c: LatLng) =>
    onChangeBoundary(pts.map((p, idx) => (idx === i ? c : p)));
  const removeVertex = (i: number) =>
    onChangeBoundary(pts.filter((_, idx) => idx !== i));
  const undo = () => onChangeBoundary(pts.slice(0, -1));
  const clear = () => onChangeBoundary([]);
  const seed = () => onChangeBoundary(rectFromArea(center, 400));

  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={center}
        zoom={17}
        scrollWheelZoom={false}
        style={{ height: "100%", width: "100%" }}
      >
        {view === "sat" ? (
          <>
            <TileLayer
              attribution="Imagery &copy; Esri, Maxar, Earthstar Geographics"
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              maxNativeZoom={19}
              maxZoom={21}
            />
            <TileLayer
              url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}"
              maxNativeZoom={19}
              maxZoom={21}
            />
          </>
        ) : (
          <TileLayer
            attribution="&copy; CARTO"
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          />
        )}

        <ClickToAdd onAdd={addVertex} />
        <FitOnce center={center} />

        {/* Lotes ya dibujados (los no seleccionados, tenues y clickeables) */}
        {lots.map((lot, i) => {
          if (i === selected || lot.boundary.length < 3) return null;
          const c = LOT_STATUS_COLORS[lot.status];
          return (
            <Polygon
              key={i}
              positions={lot.boundary}
              pathOptions={{
                color: c.stroke,
                weight: 1.5,
                fillColor: c.fill,
                fillOpacity: 0.4,
              }}
              eventHandlers={{ click: () => onSelect(i) }}
            >
              <Tooltip direction="center" permanent className="nua-lot-tip">
                {lot.number}
              </Tooltip>
            </Polygon>
          );
        })}

        {/* Lote en edición */}
        {pts.length >= 3 && (
          <Polygon
            positions={pts}
            pathOptions={{ color: EDIT, weight: 3, fillColor: EDIT, fillOpacity: 0.3 }}
          />
        )}
        {pts.length === 2 && (
          <Polyline positions={pts} pathOptions={{ color: EDIT, weight: 3 }} />
        )}
        {current &&
          pts.map((p, i) => (
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

      {/* Controles de dibujo del lote seleccionado */}
      <div className="absolute bottom-3 left-3 z-[1000] flex flex-wrap items-center gap-2 rounded-xl border border-white/50 bg-white/92 px-3 py-2 text-xs shadow-md backdrop-blur">
        {current ? (
          <>
            <span className="font-semibold text-ink">Lote {current.number}:</span>
            <button
              type="button"
              onClick={seed}
              className="rounded-full bg-sage-500 px-3 py-1.5 font-medium text-white hover:bg-moss-600"
            >
              ▢ Rectángulo
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
              {pts.length === 0 ? "Tocá cada esquina" : `${pts.length} puntos`}
            </span>
          </>
        ) : (
          <span className="text-ink-soft/70">
            Elegí o agregá un lote de la lista para dibujarlo →
          </span>
        )}
      </div>
    </div>
  );
}
