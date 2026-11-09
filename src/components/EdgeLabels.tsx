"use client";

import { useMemo, useState } from "react";
import { Marker, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { centroid, edgeLengths, formatMeters, midpoint, toXY, type LatLng } from "@/lib/geo";

/** Metros que ocupa un píxel a este zoom. */
export function metersPerPixel(lat: number, zoom: number) {
  return (156543.03392 * Math.cos((lat * Math.PI) / 180)) / 2 ** zoom;
}

function labelIcon(text: string, dx: number, dy: number) {
  return L.divIcon({
    className: "nua-edge-label",
    html: `<span style="transform:translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))">${text}</span>`,
    iconSize: [0, 0],
  });
}

/** Zoom actual del mapa (se actualiza al terminar cada zoom). */
export function useMapZoom() {
  const map = useMap();
  const [zoom, setZoom] = useState(() => map.getZoom());
  useMapEvents({
    zoomend() {
      setZoom(map.getZoom());
    },
  });
  return zoom;
}

/**
 * Medida de cada lado del terreno ("12 m"), del lado de afuera. Los lados que
 * en pantalla son muy cortos no llevan etiqueta: se pisarían entre sí.
 */
export default function EdgeLabels({
  points,
  closed = true,
  minPx = 44,
}: {
  points: LatLng[];
  closed?: boolean;
  minPx?: number;
}) {
  const zoom = useMapZoom();
  const labels = useMemo(() => {
    if (points.length < 2) return [];
    const edges = closed && points.length >= 3 ? points.length : points.length - 1;
    if (edges > 12) return [];
    const lens = edgeLengths(points);
    const c = centroid(points);
    const mpp = metersPerPixel(c[0], zoom);
    const out: { pos: LatLng; text: string; dx: number; dy: number }[] = [];
    for (let i = 0; i < edges; i++) {
      if (lens[i] / mpp < minPx) continue;
      const a = points[i];
      const b = points[(i + 1) % points.length];
      const m = midpoint(a, b);
      const [ex, ey] = toXY(b, a);
      const len = Math.hypot(ex, ey) || 1;
      // Normal del lado, hacia afuera del terreno.
      let nx = -ey / len;
      let ny = ex / len;
      const [mx, my] = toXY(m, c);
      if (nx * mx + ny * my < 0) {
        nx = -nx;
        ny = -ny;
      }
      // En pantalla y crece hacia abajo (sur).
      out.push({ pos: m, text: formatMeters(lens[i]), dx: nx * 16, dy: -ny * 16 });
    }
    return out;
  }, [points, closed, zoom, minPx]);

  return (
    <>
      {labels.map((l, i) => (
        <Marker
          key={i}
          position={l.pos}
          icon={labelIcon(l.text, l.dx, l.dy)}
          interactive={false}
          keyboard={false}
        />
      ))}
    </>
  );
}
