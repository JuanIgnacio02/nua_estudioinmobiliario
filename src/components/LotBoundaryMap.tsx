"use client";

import { useEffect, useMemo, useState } from "react";
import { MapContainer, Polygon, Tooltip, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import StreetTiles from "@/components/StreetTiles";
import MobileMapGuard from "@/components/MobileMapGuard";
import SatelliteTiles, { SAT_MAX_ZOOM } from "@/components/SatelliteTiles";
import EdgeLabels from "@/components/EdgeLabels";
import { areaM2, formatMeters, rectFromCorners, type LatLng } from "@/lib/geo";
import { formatArea, type Property } from "@/lib/properties";

/* ------------------------------------------------------------------ *
 * Lo que ocupa la propiedad: el terreno marcado en el admin, sobre la
 * foto satelital, con la medida de cada lado y la superficie.
 * ------------------------------------------------------------------ */

const BRAND = "#acb297"; // celadon-400 (verde NÚA)

function FitToBoundary({ points }: { points: LatLng[] }) {
  const map = useMap();
  // Encuadra el terreno. El timeout da tiempo a que el contenedor tenga tamaño.
  const key = points.map((p) => p.join(",")).join("|");
  useEffect(() => {
    if (!points.length) return;
    const bounds = L.latLngBounds(points.map((p) => L.latLng(p[0], p[1])));
    const t = setTimeout(() => {
      map.invalidateSize({ animate: false });
      // Tope 19: el terreno se ve grande, con lugar para las medidas.
      map.fitBounds(bounds, { padding: [80, 80], maxZoom: 19 });
    }, 200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, key]);
  return null;
}

export default function LotBoundaryMap({
  property,
  boundary,
}: {
  property: Property;
  boundary: LatLng[];
}) {
  const [view, setView] = useState<"sat" | "mapa">("sat");

  const rect = useMemo(() => rectFromCorners(boundary), [boundary]);
  // La superficie de la ficha manda; si no hay, la del dibujo.
  const area = property.area > 0 ? property.area : Math.round(areaM2(boundary));

  return (
    <div className="relative h-full w-full overflow-hidden">
      <MapContainer
        center={boundary[0]}
        zoom={18}
        maxZoom={SAT_MAX_ZOOM}
        scrollWheelZoom={false}
        zoomControl
        style={{ height: "100%", width: "100%" }}
        className="h-full w-full"
      >
        {view === "sat" ? <SatelliteTiles /> : <StreetTiles />}

        <Polygon
          positions={boundary}
          pathOptions={{
            color: BRAND,
            weight: 3,
            fillColor: BRAND,
            fillOpacity: 0.25,
          }}
        >
          <Tooltip direction="center" permanent className="nua-lot-tip">
            {formatArea(area)}
          </Tooltip>
        </Polygon>
        <EdgeLabels points={boundary} />

        <FitToBoundary points={boundary} />
        <MobileMapGuard placement="top" />
      </MapContainer>

      {/* Satélite / calles */}
      <div className="absolute right-3 top-3 z-[1000] flex overflow-hidden rounded-full border border-white/60 bg-white/90 text-xs font-medium shadow-md backdrop-blur">
        {(["sat", "mapa"] as const).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            aria-pressed={view === v}
            className={`px-3.5 py-1.5 transition-colors ${
              view === v ? "bg-sage-500 text-white" : "text-ink-soft hover:bg-mint-100"
            }`}
          >
            {v === "sat" ? "Satélite" : "Calles"}
          </button>
        ))}
      </div>

      {/* Qué se está viendo */}
      <div className="pointer-events-none absolute bottom-3 left-3 z-[1000] flex items-center gap-2.5 rounded-2xl border border-white/50 bg-white/92 px-3.5 py-2 shadow-md backdrop-blur">
        <span
          aria-hidden
          className="h-3.5 w-3.5 shrink-0 rounded-[4px] border-2"
          style={{ borderColor: BRAND, background: `${BRAND}55` }}
        />
        <span className="text-[0.72rem] leading-tight text-ink-soft">
          <span className="font-semibold text-ink">Terreno de {formatArea(area)}</span>
          {rect && (
            <span className="block text-ink-soft/70">
              {formatMeters(Math.min(rect.width, rect.depth))} ×{" "}
              {formatMeters(Math.max(rect.width, rect.depth))}
            </span>
          )}
        </span>
      </div>
    </div>
  );
}
