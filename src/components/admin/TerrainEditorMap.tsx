"use client";

import { useEffect, useMemo, useRef } from "react";
import {
  MapContainer,
  Marker,
  Polygon,
  Polyline,
  Tooltip,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import StreetTiles from "@/components/StreetTiles";
import SatelliteTiles, { SAT_MAX_ZOOM } from "@/components/SatelliteTiles";
import EdgeLabels, { metersPerPixel, useMapZoom } from "@/components/EdgeLabels";
import {
  edgeLengths,
  midpoint,
  rectFrontHandle,
  angleFacing,
  type LatLng,
  type Rect,
} from "@/lib/geo";

const BRAND = "#acb297";

export type OtherShape = {
  points: LatLng[];
  label: string;
  stroke: string;
  fill: string;
  onClick?: () => void;
};

/* --------------------------- Íconos (divIcon) --------------------------- */

// Los íconos se reutilizan: cambiarlos en cada render recrea el HTML del pin.
const vertexIcons = new Map<string, L.DivIcon>();
function vertexIcon(n: number, selected: boolean, first: boolean) {
  const key = `${n}|${selected}|${first}`;
  let icon = vertexIcons.get(key);
  if (!icon) {
    icon = makeVertexIcon(n, selected, first);
    vertexIcons.set(key, icon);
  }
  return icon;
}
function makeVertexIcon(n: number, selected: boolean, first: boolean) {
  const size = selected ? 28 : 24;
  return L.divIcon({
    className: "nua-vertex",
    html: `<span class="nua-vertex__dot${selected ? " is-selected" : ""}${first ? " is-first" : ""}" style="width:${size}px;height:${size}px">${n}</span>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

const midIcon = L.divIcon({
  className: "nua-vertex",
  html: `<span class="nua-mid">+</span>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

const moveIcon = L.divIcon({
  className: "nua-vertex",
  html: `<span class="nua-handle" title="Arrastrá para mover"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20M2 12h20M12 2l-3 3M12 2l3 3M12 22l-3-3M12 22l3-3M2 12l3-3M2 12l3 3M22 12l-3-3M22 12l-3 3"/></svg></span>`,
  iconSize: [38, 38],
  iconAnchor: [19, 19],
});

const rotateIcon = L.divIcon({
  className: "nua-vertex",
  html: `<span class="nua-handle nua-handle--rotate" title="Arrastrá para girar"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/></svg></span>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

/* ------------------------------ Ayudantes ------------------------------ */

function Fit({ points, pin, fitKey }: { points: LatLng[]; pin: LatLng; fitKey: number }) {
  const map = useMap();
  const pointsRef = useRef(points);
  useEffect(() => {
    pointsRef.current = points;
  });
  useEffect(() => {
    const t = setTimeout(() => {
      map.invalidateSize({ animate: false });
      const pts = pointsRef.current;
      if (pts.length >= 2) {
        map.fitBounds(L.latLngBounds(pts.map((p) => L.latLng(p[0], p[1]))), {
          padding: [70, 70],
          maxZoom: 19,
        });
      } else {
        map.setView(pin, 18);
      }
    }, 120);
    return () => clearTimeout(t);
    // Solo cuando se pide encuadrar (fitKey), no en cada movimiento.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, fitKey]);
  return null;
}

/**
 * Al entrar/salir de pantalla completa: recalcula el tamaño y prende o apaga
 * el zoom con la rueda. Fuera de pantalla completa la rueda tiene que mover la
 * página: si no, al pasar el mouse por el mapa el scroll "se trababa".
 */
function Resize({ token }: { token: unknown }) {
  const map = useMap();
  useEffect(() => {
    if (token) map.scrollWheelZoom.enable();
    else map.scrollWheelZoom.disable();
    const t = setTimeout(() => map.invalidateSize({ animate: false }), 60);
    return () => clearTimeout(t);
  }, [map, token]);
  return null;
}

function MapClicks({ onClick }: { onClick: (p: LatLng) => void }) {
  useMapEvents({
    click(e) {
      onClick([e.latlng.lat, e.latlng.lng]);
    },
  });
  return null;
}

/** Arrastrar el rectángulo entero con el mouse (en táctil se usa la manija). */
function useBodyDrag(
  enabled: boolean,
  onStart: () => void,
  onMove: (delta: [number, number]) => void
) {
  const map = useMap();
  return useMemo(() => {
    if (!enabled) return undefined;
    return {
      mousedown: (e: L.LeafletMouseEvent) => {
        if ((e.originalEvent as PointerEvent).pointerType === "touch") return;
        L.DomEvent.stop(e);
        onStart();
        map.dragging.disable();
        let last = e.latlng;
        const move = (ev: L.LeafletMouseEvent) => {
          onMove([ev.latlng.lat - last.lat, ev.latlng.lng - last.lng]);
          last = ev.latlng;
        };
        const up = () => {
          map.off("mousemove", move);
          map.dragging.enable();
          document.removeEventListener("mouseup", up);
        };
        map.on("mousemove", move);
        document.addEventListener("mouseup", up);
      },
    };
  }, [enabled, map, onStart, onMove]);
}

/* -------------------------------- Mapa -------------------------------- */

export type TerrainEditorMapProps = {
  pin: LatLng;
  view: "sat" | "mapa";
  mode: "rect" | "free";
  points: LatLng[];
  rect: Rect | null;
  closed: boolean;
  selected: number | null;
  others?: OtherShape[];
  fitKey: number;
  resizeToken: unknown;
  onMapClick: (p: LatLng) => void;
  onGestureStart: () => void;
  onVertexMove: (i: number, p: LatLng) => void;
  onVertexClick: (i: number) => void;
  onInsert: (afterIndex: number, p: LatLng) => void;
  onRectMove: (center: LatLng) => void;
  onRectNudge: (delta: [number, number]) => void;
  onRectRotate: (angle: number) => void;
};

export default function TerrainEditorMap(props: TerrainEditorMapProps) {
  return (
    <MapContainer
      center={props.pin}
      zoom={18}
      maxZoom={SAT_MAX_ZOOM}
      scrollWheelZoom={false}
      style={{ height: "100%", width: "100%" }}
      className="nua-editor-map"
    >
      {props.view === "sat" ? <SatelliteTiles /> : <StreetTiles />}
      <Inner {...props} />
    </MapContainer>
  );
}

function Inner({
  pin,
  mode,
  points,
  rect,
  closed,
  selected,
  others = [],
  fitKey,
  resizeToken,
  onMapClick,
  onGestureStart,
  onVertexMove,
  onVertexClick,
  onInsert,
  onRectMove,
  onRectNudge,
  onRectRotate,
}: TerrainEditorMapProps) {
  const zoom = useMapZoom();
  const isRect = mode === "rect" && rect;
  const polygonDone = points.length >= 3 && (mode === "rect" || closed);
  const bodyDrag = useBodyDrag(Boolean(isRect), onGestureStart, onRectNudge);

  // "+" solo en lados que en pantalla tienen lugar para tocarlos.
  const mpp = metersPerPixel(points[0]?.[0] ?? pin[0], zoom);

  return (
    <>
      <Fit points={points} pin={pin} fitKey={fitKey} />
      <Resize token={resizeToken} />
      <MapClicks onClick={onMapClick} />

      {/* Otros lotes del loteo (tenues, se pueden elegir) */}
      {others.map((o, i) =>
        o.points.length >= 3 ? (
          <Polygon
            key={i}
            positions={o.points}
            pathOptions={{
              color: o.stroke,
              weight: 1.5,
              fillColor: o.fill,
              fillOpacity: 0.35,
              bubblingMouseEvents: false,
            }}
            eventHandlers={o.onClick ? { click: o.onClick } : undefined}
          >
            <Tooltip direction="center" permanent className="nua-lot-tip">
              {o.label}
            </Tooltip>
          </Polygon>
        ) : null
      )}

      {/* Terreno en edición */}
      {polygonDone && (
        <Polygon
          positions={points}
          pathOptions={{
            color: BRAND,
            weight: 3,
            fillColor: BRAND,
            fillOpacity: 0.3,
            bubblingMouseEvents: false,
            className: isRect ? "nua-draggable-shape" : undefined,
          }}
          eventHandlers={bodyDrag}
        />
      )}
      {!polygonDone && points.length >= 2 && (
        <Polyline positions={points} pathOptions={{ color: BRAND, weight: 3 }} />
      )}
      {/* Mientras se dibuja: línea punteada de cierre */}
      {mode === "free" && !closed && points.length >= 3 && (
        <Polyline
          positions={[points[points.length - 1], points[0]]}
          pathOptions={{ color: BRAND, weight: 2, dashArray: "6 6" }}
        />
      )}

      <EdgeLabels points={points} closed={polygonDone} />

      {/* Rectángulo: mover y girar */}
      {isRect && (
        <>
          <Marker
            position={rect.center}
            icon={moveIcon}
            draggable
            eventHandlers={{
              dragstart: onGestureStart,
              drag: (e) => {
                const ll = (e.target as L.Marker).getLatLng();
                onRectMove([ll.lat, ll.lng]);
              },
            }}
          />
          <Marker
            // Siempre a ~58 px del frente (más allá de la medida), a cualquier zoom.
            position={rectFrontHandle(rect, 58 * metersPerPixel(rect.center[0], zoom))}
            icon={rotateIcon}
            draggable
            eventHandlers={{
              dragstart: onGestureStart,
              drag: (e) => {
                const ll = (e.target as L.Marker).getLatLng();
                onRectRotate(angleFacing(rect.center, [ll.lat, ll.lng]));
              },
            }}
          />
        </>
      )}

      {/* Forma libre: esquinas y "+" para agregar en el medio de un lado */}
      {mode === "free" &&
        points.map((p, i) => (
          <Marker
            key={`v${i}`}
            position={p}
            icon={vertexIcon(i + 1, selected === i, i === 0 && !closed && points.length >= 3)}
            draggable
            zIndexOffset={1000}
            eventHandlers={{
              dragstart: onGestureStart,
              drag: (e) => {
                const ll = (e.target as L.Marker).getLatLng();
                onVertexMove(i, [ll.lat, ll.lng]);
              },
              click: () => onVertexClick(i),
            }}
          />
        ))}
      {mode === "free" &&
        closed &&
        points.map((p, i) => {
          const q = points[(i + 1) % points.length];
          if (edgeLengths([p, q])[0] / mpp < 64) return null;
          return (
            <Marker
              key={`m${i}-${points.length}`}
              position={midpoint(p, q)}
              icon={midIcon}
              draggable
              eventHandlers={{
                click: () => onInsert(i, midpoint(p, q)),
                dragend: (e) => {
                  const ll = (e.target as L.Marker).getLatLng();
                  onInsert(i, [ll.lat, ll.lng]);
                },
              }}
            />
          );
        })}
    </>
  );
}
