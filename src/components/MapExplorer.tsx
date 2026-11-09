"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import AnimatedHeading from "@/components/anim/AnimatedHeading";
import {
  formatPrice,
  formatArea,
  TYPE_LABELS,
  type Property,
} from "@/lib/properties";

const PropertiesMap = dynamic(() => import("./PropertiesMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-mint-100/40 text-sm text-sage-500">
      Cargando mapa…
    </div>
  ),
});

export default function MapExplorer({
  properties,
  showAllLink = true,
}: {
  properties: Property[];
  /** false en /propiedades: el link llevaba a la misma página. */
  showAllLink?: boolean;
}) {
  // `hovered` = preview temporal (se cierra al sacar el mouse);
  // `pinned` = fijado con clic (queda abierto). El activo es el hover si lo hay.
  const [hovered, setHovered] = useState<string | null>(null);
  const [pinned, setPinned] = useState<string | null>(null);
  const active = hovered ?? pinned;
  const [cat, setCat] = useState<"todos" | "lote" | "propiedad">("todos");
  const itemRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const listRef = useRef<HTMLDivElement>(null);

  // El mapa (Leaflet + tiles) se monta recién cuando el visitante se acerca:
  // queda lejos del primer pantallazo y no tiene sentido cargarlo de entrada.
  const mapBox = useRef<HTMLDivElement>(null);
  const [showMap, setShowMap] = useState(false);
  useEffect(() => {
    const el = mapBox.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShowMap(true);
          io.disconnect();
        }
      },
      { rootMargin: "600px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const base = useMemo(
    () =>
      properties.filter(
        (p) => p.operation === "venta" && p.coords && p.status !== "vendida"
      ),
    [properties]
  );

  const counts = useMemo(() => {
    const lote = base.filter((p) => p.type === "terreno").length;
    return { todos: base.length, lote, propiedad: base.length - lote };
  }, [base]);

  const list = useMemo(() => {
    if (cat === "lote") return base.filter((p) => p.type === "terreno");
    if (cat === "propiedad") return base.filter((p) => p.type !== "terreno");
    return base;
  }, [base, cat]);

  // Lleva la lista hasta el elegido en el mapa (no en un simple hover). La
  // lista es `relative`, así que offsetLeft/Top ya son relativos a ella.
  // Se mueve solo la lista: scrollIntoView movía también la página y en el
  // celular el mapa se iba de la pantalla.
  useEffect(() => {
    if (!pinned) return;
    const box = listRef.current;
    const item = itemRefs.current[pinned];
    if (!box || !item) return;
    const horizontal = box.scrollWidth > box.clientWidth + 4;
    box.scrollTo(
      horizontal
        ? { left: item.offsetLeft - 20, behavior: "smooth" }
        : { top: item.offsetTop - 8, behavior: "smooth" }
    );
  }, [pinned]);

  // Ignore an active selection that the current filter hides.
  const activeInList =
    active && list.some((p) => p.slug === active) ? active : null;

  const FILTERS: { key: typeof cat; label: string }[] = [
    { key: "todos", label: "Todos" },
    { key: "lote", label: "Lotes" },
    { key: "propiedad", label: "Propiedades" },
  ];

  return (
    <section className="bg-bone py-20 md:py-28">
      <div className="mx-auto max-w-[1600px] px-5 md:px-10">
        <div className="mb-10 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="text-eyebrow mb-5 flex items-center gap-3 text-sage-500">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-sage-500" />
              Mapa de propiedades
            </p>
            <AnimatedHeading
              text="Explorá dónde estamos vendiendo"
              className="font-display text-4xl text-ink md:text-6xl"
            />
          </div>
          <p className="max-w-sm text-sm text-ink-soft/70 md:text-right">
            Pasá por la lista o tocá un marcador: el mapa vuela hasta la
            propiedad. {list.length}{" "}
            {cat === "lote"
              ? "lotes"
              : cat === "propiedad"
                ? "propiedades"
                : "publicaciones"}{" "}
            en venta en San Rafael y la región.
          </p>
        </div>

        {/* Filtro por tipo — solo pines en el mapa */}
        <div className="mb-8 flex flex-wrap gap-2">
          {FILTERS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setCat(key)}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                cat === key
                  ? "border-moss-600 bg-moss-600 text-mint-100"
                  : "border-moss-600/20 text-ink-soft/80 hover:bg-mint-100"
              }`}
            >
              {label}
              <span
                className={`ml-2 text-xs ${
                  cat === key ? "text-mint-100/70" : "text-ink-soft/50"
                }`}
              >
                {counts[key]}
              </span>
            </button>
          ))}
        </div>

        <div className="grid gap-5 lg:grid-cols-[380px_1fr]">
          {/* List */}
          {/* data-lenis-prevent: la lista tiene scroll propio; sin esto Lenis se
              queda con la rueda y mueve la página en lugar de la lista. */}
          {/* Celular: tarjetas que se deslizan de costado debajo del mapa (antes
              era una lista con scroll propio dentro de la página). */}
          <div
            ref={listRef}
            data-lenis-prevent
            className="no-scrollbar relative order-2 -mx-5 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-5 px-5 pb-1 md:-mx-10 md:scroll-px-10 md:px-10 lg:order-1 lg:mx-0 lg:max-h-[70vh] lg:min-h-[460px] lg:snap-none lg:flex-col lg:gap-2 lg:overflow-x-visible lg:overflow-y-auto lg:overscroll-contain lg:px-0 lg:pb-0 lg:pr-1"
          >
            {list.map((p) => {
              const isActive = active === p.slug;
              return (
                <button
                  key={p.slug}
                  ref={(el) => {
                    itemRefs.current[p.slug] = el;
                  }}
                  onMouseEnter={() => setHovered(p.slug)}
                  onMouseLeave={() => setHovered(null)}
                  onFocus={() => setHovered(p.slug)}
                  onBlur={() => setHovered(null)}
                  onClick={() =>
                    setPinned((prev) => (prev === p.slug ? null : p.slug))
                  }
                  className={`group flex w-[84%] shrink-0 snap-start gap-4 rounded-2xl border p-3 text-left transition-all duration-300 sm:w-[60%] lg:w-auto ${
                    isActive
                      ? "border-moss-600/30 bg-mint-100 shadow-[0_10px_30px_-18px_rgba(36,41,15,0.6)]"
                      : "border-transparent bg-bone-dark/40 hover:bg-mint-100/60"
                  }`}
                >
                  <div className="relative h-20 w-24 shrink-0 overflow-hidden rounded-xl bg-bone-dark">
                    {/* Miniatura de 96px: next/image pide esa medida y no la
                        foto original (antes se bajaban fotos de 1600px). */}
                    <Image
                      src={p.image}
                      alt={p.title}
                      fill
                      sizes="96px"
                      className={`object-cover transition-transform duration-500 ${
                        isActive ? "scale-105" : "group-hover:scale-105"
                      }`}
                    />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="text-[10px] uppercase tracking-[0.18em] text-sage-500">
                      {TYPE_LABELS[p.type]} · {p.city}
                    </span>
                    <span className="mt-1 line-clamp-2 font-display text-[15px] leading-tight text-ink">
                      {p.title}
                    </span>
                    <span className="mt-auto flex items-center justify-between pt-1.5">
                      <span className="font-display text-lg text-moss-600">
                        {formatPrice(p)}
                      </span>
                      <span className="text-[11px] text-ink-soft/60">
                        {formatArea(p.area)}
                      </span>
                    </span>
                  </div>
                </button>
              );
            })}
            {showAllLink && (
              <Link
                href="/propiedades"
                className="flex shrink-0 snap-start items-center justify-center rounded-2xl border border-dashed border-moss-600/25 px-6 py-3 text-center text-sm text-moss-600 transition-colors hover:bg-mint-100/50 lg:mt-1"
              >
                Ver todas las propiedades →
              </Link>
            )}
          </div>

          {/* Map */}
          <div
            ref={mapBox}
            className="order-1 h-[52vh] min-h-[340px] w-full overflow-hidden rounded-[1.75rem] border border-moss-600/10 shadow-[0_30px_60px_-30px_rgba(36,41,15,0.35)] lg:order-2 lg:h-[70vh] lg:min-h-[460px]"
          >
            {showMap ? (
              <PropertiesMap
                properties={list}
                activeSlug={activeInList}
                onSelect={(slug) => {
                  setHovered(null);
                  setPinned(slug);
                }}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-mint-100/40 text-sm text-sage-500">
                Cargando mapa…
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
