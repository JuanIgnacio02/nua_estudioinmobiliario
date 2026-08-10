"use client";

import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Polygon, Tooltip, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  LOT_STATUS_COLORS,
  LOT_STATUS_LABELS,
  loteoStats,
  type Loteo,
  type Lot,
} from "@/lib/loteos";
import { formatArea } from "@/lib/properties";

/* ------------------------------------------------------------------ *
 * Master plan interactivo de un loteo.
 * La vista satelital es la foto aérea; encima se dibujan TODOS los
 * lotes coloreados por estado. Al tocar un lote se abre su ficha.
 * ------------------------------------------------------------------ */

type LatLng = [number, number];

function priceLabel(lot: Lot) {
  return lot.price && lot.price > 0
    ? `US$ ${lot.price.toLocaleString("es-AR")}`
    : "Consultar";
}

function allPoints(loteo: Loteo): LatLng[] {
  return loteo.lots.flatMap((l) => l.boundary);
}

function FitToLots({ points }: { points: LatLng[] }) {
  const map = useMap();
  const key = points.length;
  useEffect(() => {
    if (!points.length) return;
    const bounds = L.latLngBounds(points.map((p) => L.latLng(p[0], p[1])));
    const t = setTimeout(() => {
      map.invalidateSize({ animate: false });
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 19 });
    }, 200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, key]);
  return null;
}

export default function LoteoMasterPlan({
  loteo,
  phoneHref,
}: {
  loteo: Loteo;
  phoneHref: string;
}) {
  const [view, setView] = useState<"sat" | "mapa">("sat");
  const [selected, setSelected] = useState<number | null>(null);

  const center = loteo.coords;
  const points = useMemo(() => allPoints(loteo), [loteo]);
  const stats = useMemo(() => loteoStats(loteo), [loteo]);
  const active = selected != null ? loteo.lots[selected] : null;

  const wa = (lot: Lot) =>
    `https://wa.me/${phoneHref}?text=${encodeURIComponent(
      `Hola! Me interesa el lote ${lot.number} del ${loteo.title} (${formatArea(
        lot.area
      )}). ¿Me pasan más info?`
    )}`;

  return (
    <div className="relative h-full w-full overflow-hidden">
      <MapContainer
        center={center}
        zoom={17}
        scrollWheelZoom={false}
        zoomControl
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
            attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          />
        )}

        {loteo.lots.map((lot, i) => {
          const c = LOT_STATUS_COLORS[lot.status];
          const isSel = i === selected;
          return (
            <Polygon
              key={i}
              positions={lot.boundary}
              pathOptions={{
                color: isSel ? "#16180f" : c.stroke,
                weight: isSel ? 4 : 2,
                fillColor: c.fill,
                fillOpacity: isSel ? 0.75 : 0.55,
              }}
              eventHandlers={{ click: () => setSelected(i) }}
            >
              <Tooltip direction="center" permanent className="nua-lot-tip">
                {lot.number}
              </Tooltip>
            </Polygon>
          );
        })}

        <FitToLots points={points} />
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

      {/* Leyenda + conteo */}
      <div className="absolute left-3 top-3 z-[1000] rounded-2xl border border-white/50 bg-white/92 px-4 py-3 text-xs shadow-md backdrop-blur">
        <p className="mb-2 font-semibold text-ink">
          {stats.total} lotes
          {stats.desde
            ? ` · desde US$ ${stats.desde.toLocaleString("es-AR")}`
            : ""}
        </p>
        <ul className="space-y-1">
          {(["disponible", "reservado", "vendido"] as const).map((st) => (
            <li key={st} className="flex items-center gap-2">
              <span
                className="inline-block h-3 w-3 rounded-sm"
                style={{
                  background: LOT_STATUS_COLORS[st].fill,
                  border: `1.5px solid ${LOT_STATUS_COLORS[st].stroke}`,
                }}
              />
              <span className="text-ink-soft">
                {LOT_STATUS_LABELS[st]}
                <span className="ml-1 font-semibold text-ink">{stats[st]}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Ficha del lote seleccionado */}
      {active && (
        <div className="absolute bottom-3 left-3 right-3 z-[1000] mx-auto max-w-sm rounded-2xl border border-white/50 bg-white/95 p-4 shadow-lg backdrop-blur sm:right-auto">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-sage-500">
                Lote {active.number}
              </p>
              <p className="mt-0.5 font-display text-2xl text-ink">
                {priceLabel(active)}
              </p>
            </div>
            <button
              onClick={() => setSelected(null)}
              className="rounded-full px-2 py-1 text-lg leading-none text-ink-soft/50 hover:bg-mint-100 hover:text-ink"
              aria-label="Cerrar"
            >
              ×
            </button>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-soft/80">
            <span>{formatArea(active.area)}</span>
            <span
              className="rounded-full px-2 py-0.5 text-xs font-medium"
              style={{
                background: LOT_STATUS_COLORS[active.status].fill,
                color: LOT_STATUS_COLORS[active.status].stroke,
              }}
            >
              {LOT_STATUS_LABELS[active.status]}
            </span>
            {active.price && active.price > 0 && active.area > 0 && (
              <span className="text-ink-soft/60">
                US$ {Math.round(active.price / active.area).toLocaleString("es-AR")}/m²
              </span>
            )}
          </div>
          {active.status !== "vendido" && (
            <a
              href={wa(active)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 flex items-center justify-center rounded-full bg-sage-500 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-moss-600"
            >
              Consultar por WhatsApp
            </a>
          )}
        </div>
      )}

      {/* Hint inicial */}
      {!active && (
        <div className="pointer-events-none absolute bottom-3 left-1/2 z-[1000] -translate-x-1/2 rounded-full border border-white/50 bg-white/90 px-4 py-1.5 text-xs font-medium text-ink-soft shadow-md backdrop-blur">
          Tocá un lote para ver precio y disponibilidad
        </div>
      )}
    </div>
  );
}
