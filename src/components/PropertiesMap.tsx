"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { formatPrice, TYPE_LABELS, type Property } from "@/lib/properties";

type Pin = { property: Property; pos: [number, number] };

// Price-pill marker in brand moss green; grows + darkens when active.
function priceIcon(label: string, active: boolean) {
  return L.divIcon({
    className: `nua-pin${active ? " nua-pin--active" : ""}`,
    html: `<div class="nua-pin__pill">${label}</div><span class="nua-pin__tip"></span>`,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
}

function FlyController({
  activeSlug,
  pins,
  markerRefs,
  initialPoints,
  focus = false,
}: {
  activeSlug: string | null;
  pins: Pin[];
  markerRefs: React.MutableRefObject<Record<string, L.Marker | null>>;
  initialPoints: [number, number][];
  focus?: boolean;
}) {
  const map = useMap();

  // Fix gray/partial tiles: recompute size once the container has settled,
  // and whenever it resizes. This is the usual cause of a "weak" map.
  useEffect(() => {
    const fix = () => map.invalidateSize({ animate: false });
    const timers = [100, 300, 700, 1200].map((t) => setTimeout(fix, t));
    window.addEventListener("resize", fix);
    const ro = new ResizeObserver(fix);
    ro.observe(map.getContainer());
    return () => {
      timers.forEach(clearTimeout);
      window.removeEventListener("resize", fix);
      ro.disconnect();
    };
  }, [map]);

  // Initial framing on San Rafael (after a tick so size is correct).
  useEffect(() => {
    if (initialPoints.length === 0) return;
    const t = setTimeout(() => {
      map.invalidateSize({ animate: false });
      if (initialPoints.length === 1)
        map.setView(initialPoints[0], focus ? 14 : 14);
      else map.fitBounds(initialPoints, { padding: [60, 60], maxZoom: 14 });
    }, 250);
    return () => clearTimeout(t);
  }, [map, initialPoints]);

  // Fly to the active property and open its popup; close it when none.
  useEffect(() => {
    if (!activeSlug) {
      map.closePopup();
      return;
    }
    const pin = pins.find((p) => p.property.slug === activeSlug);
    if (!pin) return;
    map.flyTo(pin.pos, 15, { duration: 1.1 });
    const marker = markerRefs.current[activeSlug];
    if (marker) {
      const t = setTimeout(() => marker.openPopup(), 650);
      return () => clearTimeout(t);
    }
  }, [activeSlug, map, pins, markerRefs]);

  return null;
}

// Zoom con Ctrl/⌘ + rueda; sin Ctrl el scroll mueve la página (con aviso).
function WheelZoom({ onHint }: { onHint: (show: boolean) => void }) {
  const map = useMap();
  useEffect(() => {
    const container = map.getContainer();
    let timer: ReturnType<typeof setTimeout> | null = null;
    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        onHint(false);
        const target = map.getZoom() + (e.deltaY > 0 ? -1 : 1);
        map.setZoomAround(map.mouseEventToLatLng(e), target);
      } else {
        onHint(true);
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => onHint(false), 1300);
      }
    };
    container.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      container.removeEventListener("wheel", onWheel);
      if (timer) clearTimeout(timer);
    };
  }, [map, onHint]);
  return null;
}

export default function PropertiesMap({
  properties,
  activeSlug = null,
  onSelect,
  focusSlug,
  zoom = 12,
}: {
  properties: Property[];
  activeSlug?: string | null;
  onSelect?: (slug: string | null) => void;
  /** When set, show only this property centered on the map. */
  focusSlug?: string;
  zoom?: number;
}) {
  const markerRefs = useRef<Record<string, L.Marker | null>>({});

  const pins = useMemo<Pin[]>(
    () =>
      properties
        .filter(
          (p) =>
            p.coords &&
            (focusSlug ? p.slug === focusSlug : p.operation === "venta")
        )
        .map((p) => ({ property: p, pos: p.coords as [number, number] })),
    [properties, focusSlug]
  );

  const initialPoints = useMemo<[number, number][]>(
    () =>
      focusSlug
        ? pins.map((p) => p.pos)
        : pins
            .filter((p) => p.property.city === "San Rafael")
            .map((p) => p.pos),
    [pins, focusSlug]
  );

  const center = pins[0]?.pos ?? [-34.6176, -68.3319];
  const [hint, setHint] = useState(false);

  return (
    <div className="relative h-full w-full">
    <MapContainer
      center={center}
      zoom={focusSlug ? 14 : zoom}
      scrollWheelZoom={false}
      style={{ height: "100%", width: "100%" }}
      className="h-full w-full"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
      />
      <WheelZoom onHint={setHint} />
      <FlyController
        activeSlug={activeSlug}
        pins={pins}
        markerRefs={markerRefs}
        initialPoints={initialPoints}
        focus={!!focusSlug}
      />
      {pins.map(({ property, pos }) => (
        <Marker
          key={property.slug}
          position={pos}
          icon={priceIcon(formatPrice(property), property.slug === activeSlug)}
          ref={(m) => {
            markerRefs.current[property.slug] = m;
          }}
          eventHandlers={{
            click: () => onSelect?.(property.slug),
          }}
        >
          <Popup>
            <div className="nua-popup">
              <img src={property.image} alt={property.title} />
              <div className="nua-popup__body">
                <span className="nua-popup__type">
                  {TYPE_LABELS[property.type]} · {property.city}
                </span>
                <strong>{property.title}</strong>
                <span className="nua-popup__price">{formatPrice(property)}</span>
                <Link href={`/propiedades/${property.slug}`}>
                  Ver propiedad →
                </Link>
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>

      {/* Aviso: cómo hacer zoom */}
      <div
        className={`pointer-events-none absolute inset-0 z-[1000] flex items-center justify-center transition-opacity duration-300 ${
          hint ? "opacity-100" : "opacity-0"
        }`}
      >
        <span className="rounded-full bg-ink/80 px-5 py-2.5 text-sm font-medium text-bone shadow-lg backdrop-blur">
          Usá Ctrl + rueda para hacer zoom
        </span>
      </div>
    </div>
  );
}
