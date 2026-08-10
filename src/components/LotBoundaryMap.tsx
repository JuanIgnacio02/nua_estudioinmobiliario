"use client";

import { useEffect, useMemo, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Polygon,
  Tooltip,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { formatArea, formatPrice, type Property } from "@/lib/properties";

/* ------------------------------------------------------------------ *
 * Prototipo — Nivel 2: visor satelital con el contorno del lote.
 *
 * Idea clave: la vista satelital YA es la "foto aérea". Encima
 * dibujamos el polígono con los límites del terreno.
 *  - Si el lote trae `boundary` (contorno real cargado en el admin),
 *    se usa tal cual.
 *  - Si no, se genera un rectángulo aproximado a partir de los m²
 *    (`area`) para que ningún lote quede sin representación de escala.
 * ------------------------------------------------------------------ */

type LatLng = [number, number];

/** Rectángulo aproximado (frente × fondo) centrado en `center`, a partir del área. */
function rectFromArea(
  center: LatLng,
  areaM2: number,
  ratio = 0.48, // frente/fondo → 300 m² ≈ 12 m × 25 m
  angleDeg = 18 // leve rotación para que calce con la traza real de la calle
): LatLng[] {
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

function FitToBoundary({ points }: { points: LatLng[] }) {
  const map = useMap();
  // Encuadra el polígono. Se re-ejecuta si cambian los puntos; el timeout da
  // tiempo a que el contenedor tenga tamaño y se limpia al desmontar.
  const key = points.map((p) => p.join(",")).join("|");
  useEffect(() => {
    if (!points.length) return;
    const bounds = L.latLngBounds(points.map((p) => L.latLng(p[0], p[1])));
    const t = setTimeout(() => {
      map.invalidateSize({ animate: false });
      map.fitBounds(bounds, { padding: [70, 70], maxZoom: 19 });
    }, 200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, key]);
  return null;
}

const BRAND = "#acb297"; // celadon-400 (verde NÚA)

export default function LotBoundaryMap({
  property,
  boundary,
  showInfoCard = true,
}: {
  property: Property;
  /** Contorno real [lat,lng][]. Si falta, se aproxima por m². */
  boundary?: LatLng[];
  /** Tarjeta flotante con precio/m². Ocultala si la info ya está en la página. */
  showInfoCard?: boolean;
}) {
  const [view, setView] = useState<"sat" | "mapa">("sat");

  const center = useMemo<LatLng>(
    () => (property.coords ?? [-34.6176, -68.3319]) as LatLng,
    [property.coords]
  );
  const isReal = Boolean(boundary && boundary.length >= 3);
  const points = useMemo<LatLng[]>(
    () => (isReal ? (boundary as LatLng[]) : rectFromArea(center, property.area)),
    [isReal, boundary, center, property.area]
  );

  const hasArea = property.area > 0;
  const frontage = hasArea ? Math.round(Math.sqrt(property.area * 0.48)) : 0;
  const depth = hasArea ? Math.round(Math.sqrt(property.area / 0.48)) : 0;
  const pricePerM2 = hasArea ? Math.round(property.price / property.area) : 0;

  return (
    <div className="relative h-full w-full overflow-hidden">
      <MapContainer
        center={center}
        zoom={18}
        scrollWheelZoom={false}
        zoomControl
        style={{ height: "100%", width: "100%" }}
        className="h-full w-full"
      >
        {view === "sat" ? (
          <>
            <TileLayer
              attribution="Imagery &copy; Esri, Maxar, Earthstar Geographics"
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              maxNativeZoom={19}
              maxZoom={21}
            />
            {/* Etiquetas de calles por encima del satélite */}
            <TileLayer
              url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}"
              maxNativeZoom={19}
              maxZoom={21}
            />
          </>
        ) : (
          <TileLayer
            attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          />
        )}

        <Polygon
          positions={points}
          pathOptions={{
            color: BRAND,
            weight: 3,
            fillColor: BRAND,
            fillOpacity: 0.28,
          }}
        >
          <Tooltip direction="center" permanent className="nua-lot-tip">
            {formatArea(property.area)}
          </Tooltip>
        </Polygon>

        <FitToBoundary points={points} />
      </MapContainer>

      {/* Toggle satélite / mapa */}
      <div className="absolute right-3 top-3 z-[1000] flex overflow-hidden rounded-full border border-white/60 bg-white/90 text-xs font-medium shadow-md backdrop-blur">
        {(["sat", "mapa"] as const).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`px-3.5 py-1.5 transition-colors ${
              view === v
                ? "bg-sage-500 text-white"
                : "text-ink-soft hover:bg-mint-100"
            }`}
          >
            {v === "sat" ? "Satélite" : "Mapa"}
          </button>
        ))}
      </div>

      {/* Etiqueta de contexto — siempre visible */}
      {!showInfoCard && (
        <div className="pointer-events-none absolute bottom-3 left-3 z-[1000] rounded-full border border-white/50 bg-white/92 px-3.5 py-1.5 text-[0.7rem] font-semibold text-sage-500 shadow-md backdrop-blur">
          {isReal
            ? `Contorno del lote · ${formatArea(property.area)}`
            : `Contorno aproximado · ${formatArea(property.area)}`}
        </div>
      )}

      {/* Ficha flotante */}
      {showInfoCard && (
      <div className="pointer-events-none absolute bottom-3 left-3 z-[1000] max-w-[15rem] rounded-2xl border border-white/50 bg-white/92 p-4 shadow-lg backdrop-blur">
        <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-sage-500">
          {isReal ? "Contorno real del lote" : "Contorno aproximado según m²"}
        </p>
        <p className="mt-1 font-display text-2xl text-ink">
          {formatArea(property.area)}
        </p>
        {hasArea && !isReal && (
          <p className="text-xs text-ink-soft/70">
            ≈ {frontage} m de frente × {depth} m de fondo
          </p>
        )}
        <div className="mt-3 flex items-end justify-between gap-2 border-t border-mint-200 pt-2.5">
          <div>
            <p className="text-[0.6rem] uppercase tracking-wide text-ink-soft/60">
              Precio
            </p>
            <p className="font-semibold text-ink">{formatPrice(property)}</p>
          </div>
          {hasArea && (
            <div className="text-right">
              <p className="text-[0.6rem] uppercase tracking-wide text-ink-soft/60">
                Por m²
              </p>
              <p className="font-semibold text-ink">
                US$ {pricePerM2.toLocaleString("es-AR")}
              </p>
            </div>
          )}
        </div>
      </div>
      )}
    </div>
  );
}
