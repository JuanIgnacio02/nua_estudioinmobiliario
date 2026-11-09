"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import {
  saleRank,
  TYPE_LABELS,
  OPERATION_LABELS,
  type Operation,
  type PropertyType,
  type Property,
} from "@/lib/properties";
import PropertyCard from "@/components/PropertyCard";

type SortKey = "featured" | "price-asc" | "price-desc" | "area-desc";

const TYPES = Object.keys(TYPE_LABELS) as PropertyType[];
const OPERATIONS = Object.keys(OPERATION_LABELS) as Operation[];
const SORTS: SortKey[] = ["featured", "price-asc", "price-desc", "area-desc"];

/*
 * Rangos de precio. Venta y alquiler tienen escalas muy distintas, así que
 * cada operación tiene los suyos; elegir un rango implica esa operación.
 * Las propiedades "Consultar" (sin precio) no entran en ningún rango.
 */
type Range = { key: string; label: string; min: number; max: number; op: Operation };
const k = (n: number) => n.toLocaleString("es-AR");
const RANGES: Range[] = [
  { key: "hasta-50", label: `Hasta US$ ${k(50000)}`, min: 0, max: 50000, op: "venta" },
  { key: "50-100", label: `US$ ${k(50000)} a ${k(100000)}`, min: 50000, max: 100000, op: "venta" },
  { key: "100-200", label: `US$ ${k(100000)} a ${k(200000)}`, min: 100000, max: 200000, op: "venta" },
  { key: "200-400", label: `US$ ${k(200000)} a ${k(400000)}`, min: 200000, max: 400000, op: "venta" },
  { key: "mas-400", label: `Más de US$ ${k(400000)}`, min: 400000, max: Infinity, op: "venta" },
  { key: "alq-hasta-500", label: "Hasta US$ 500/mes", min: 0, max: 500, op: "alquiler" },
  { key: "alq-500-1000", label: "US$ 500 a 1.000/mes", min: 500, max: 1000, op: "alquiler" },
  { key: "alq-mas-1000", label: "Más de US$ 1.000/mes", min: 1000, max: Infinity, op: "alquiler" },
];
const BEDS = ["1", "2", "3", "4"];

/*
 * Los filtros viven en la URL (?tipo=terreno&operacion=venta&zona=...&orden=...):
 * - al volver de una ficha con "Atrás" siguen aplicados;
 * - una búsqueda se puede compartir por WhatsApp tal cual.
 * Se escribe con history.replaceState (no agrega entradas al historial ni
 * recarga) y se lee con useSyncExternalStore: en el servidor no hay filtros,
 * así el HTML trae el listado completo para Google y la página se cachea.
 */
const URL_CHANGE = "nua:filters";

function subscribe(onChange: () => void) {
  window.addEventListener(URL_CHANGE, onChange);
  window.addEventListener("popstate", onChange);
  return () => {
    window.removeEventListener(URL_CHANGE, onChange);
    window.removeEventListener("popstate", onChange);
  };
}

function writeParams(changes: Record<string, string | null>) {
  const url = new URL(window.location.href);
  url.searchParams.delete("type"); // nombre viejo (links del footer)
  for (const [k, v] of Object.entries(changes)) {
    if (v === null) url.searchParams.delete(k);
    else url.searchParams.set(k, v);
  }
  window.history.replaceState(window.history.state, "", url);
  window.dispatchEvent(new Event(URL_CHANGE));
}

export default function PropertyExplorer({
  properties,
  zones,
  phoneHref,
}: {
  properties: Property[];
  zones: string[];
  /** WhatsApp del admin, para ofrecer contacto cuando no hay resultados. */
  phoneHref?: string;
}) {
  const [sheet, setSheet] = useState(false);
  // Panel abierto: la página de atrás no se mueve y Esc lo cierra.
  useEffect(() => {
    if (!sheet) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setSheet(false);
    document.body.style.overflow = "hidden";
    window.dispatchEvent(new CustomEvent("nua:scroll-lock", { detail: true }));
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.dispatchEvent(new CustomEvent("nua:scroll-lock", { detail: false }));
      window.removeEventListener("keydown", onKey);
    };
  }, [sheet]);

  const search = useSyncExternalStore(
    subscribe,
    () => window.location.search,
    () => ""
  );
  const params = new URLSearchParams(search);

  const rawType = params.get("tipo") ?? params.get("type");
  const effectiveType: PropertyType | "all" =
    rawType && rawType in TYPE_LABELS ? (rawType as PropertyType) : "all";
  const rawOp = params.get("operacion");
  const operation: Operation | "all" =
    rawOp && rawOp in OPERATION_LABELS ? (rawOp as Operation) : "all";
  const rawZone = params.get("zona");
  const zone = rawZone && zones.includes(rawZone) ? rawZone : "all";
  const rawSort = params.get("orden") as SortKey | null;
  const sort: SortKey = rawSort && SORTS.includes(rawSort) ? rawSort : "featured";
  const rawRange = RANGES.find((r) => r.key === params.get("precio")) ?? null;
  // Un rango de venta con "Alquiler" elegido (o al revés) no aplica.
  const range = rawRange && (operation === "all" || rawRange.op === operation) ? rawRange : null;
  const rawBeds = params.get("dormitorios");
  const beds = rawBeds && BEDS.includes(rawBeds) ? Number(rawBeds) : 0;
  // Rangos que se ofrecen: los de la operación elegida (o venta si son todas).
  const rangeOptions = RANGES.filter((r) => r.op === (operation === "alquiler" ? "alquiler" : "venta"));

  // Cambiar de operación borra un rango de precio que ya no corresponde.
  const setOperation = (v: Operation | "all") =>
    writeParams({
      operacion: v === "all" ? null : v,
      ...(range && v !== "all" && range.op !== v ? { precio: null } : {}),
    });
  const setRange = (v: string) => writeParams({ precio: v === "all" ? null : v });
  const setBeds = (v: string) => writeParams({ dormitorios: v === "all" ? null : v });
  const setType = (v: PropertyType | "all") =>
    writeParams({ tipo: v === "all" ? null : v });
  const setZone = (v: string) => writeParams({ zona: v === "all" ? null : v });
  const setSort = (v: SortKey) =>
    writeParams({ orden: v === "featured" ? null : v });

  const results = useMemo(() => {
    let list = properties.filter((p) => {
      if (operation !== "all" && p.operation !== operation) return false;
      if (effectiveType !== "all" && p.type !== effectiveType) return false;
      if (zone !== "all" && p.zone !== zone) return false;
      if (range) {
        if (p.operation !== range.op || !p.price) return false;
        if (p.price < range.min || p.price >= range.max) return false;
      }
      if (beds && (p.bedrooms ?? 0) < beds) return false;
      return true;
    });
    list = [...list].sort((a, b) => {
      // Disponibles primero, vendidas al final, sea cual sea el orden elegido.
      const rank = saleRank(a) - saleRank(b);
      if (rank !== 0) return rank;
      switch (sort) {
        case "price-asc":
          return a.price - b.price;
        case "price-desc":
          return b.price - a.price;
        case "area-desc":
          return b.area - a.area;
        default:
          return Number(b.featured) - Number(a.featured) || b.price - a.price;
      }
    });
    return list;
  }, [properties, operation, effectiveType, zone, sort, range, beds]);

  const reset = () =>
    writeParams({
      operacion: null,
      tipo: null,
      zona: null,
      orden: null,
      precio: null,
      dormitorios: null,
    });

  // effectiveType y no `type`: `type` arranca en null ("todavía no eligió"),
  // y comparar null con "all" mostraba "Limpiar" sin ningún filtro activo.
  const hasFilters =
    operation !== "all" ||
    effectiveType !== "all" ||
    zone !== "all" ||
    range !== null ||
    beds > 0;

  const filterFields = (
    <>
      <Select
        label="Operación"
        value={operation}
        onChange={(v) => setOperation(v as Operation | "all")}
        options={[
          ["all", "Todas"],
          ...OPERATIONS.map((o) => [o, OPERATION_LABELS[o]] as [string, string]),
        ]}
      />
      <Select
        label="Tipo"
        value={effectiveType}
        onChange={(v) => setType(v as PropertyType | "all")}
        options={[
          ["all", "Todos"],
          ...TYPES.map((t) => [t, TYPE_LABELS[t]] as [string, string]),
        ]}
      />
      <Select
        label="Zona"
        value={zone}
        onChange={setZone}
        options={[["all", "Todas"], ...zones.map((z) => [z, z] as [string, string])]}
      />
      <Select
        label="Precio"
        value={range?.key ?? "all"}
        onChange={setRange}
        options={[
          ["all", "Cualquiera"],
          ...rangeOptions.map((r) => [r.key, r.label] as [string, string]),
        ]}
      />
      <Select
        label="Dormitorios"
        value={beds ? String(beds) : "all"}
        onChange={setBeds}
        options={[["all", "Todos"], ...BEDS.map((b) => [b, `${b} o más`] as [string, string])]}
      />
    </>
  );

  // Filtros activos como chips que se quitan con un toque (celular).
  const chips: { label: string; clear: () => void }[] = [
    ...(operation !== "all"
      ? [{ label: OPERATION_LABELS[operation], clear: () => setOperation("all") }]
      : []),
    ...(effectiveType !== "all"
      ? [{ label: TYPE_LABELS[effectiveType], clear: () => setType("all") }]
      : []),
    ...(zone !== "all" ? [{ label: zone, clear: () => setZone("all") }] : []),
    ...(range ? [{ label: range.label, clear: () => setRange("all") }] : []),
    ...(beds ? [{ label: `${beds}+ dorm.`, clear: () => setBeds("all") }] : []),
  ];

  const countLabel = `${results.length} ${results.length === 1 ? "propiedad" : "propiedades"}`;

  return (
    <div className="mx-auto max-w-7xl px-6 md:px-10">
      {/* Celular: barra compacta fija + panel de filtros desde abajo. Antes
          eran tres filas de selectores que desaparecían al bajar. */}
      <div className="sticky top-16 z-30 -mx-6 border-b border-moss-600/10 bg-bone/90 px-6 py-3 backdrop-blur-xl md:hidden">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setSheet(true)}
            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-moss-600 px-5 text-sm font-medium text-mint-100"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
              <path d="M4 6h16M7 12h10M10 18h4" />
            </svg>
            Filtros
            {chips.length > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-mint-50 px-1 text-[11px] font-semibold text-moss-700">
                {chips.length}
              </span>
            )}
          </button>
          <span className="flex-1" />
          <label className="relative">
            <span className="sr-only">Ordenar</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="min-h-11 cursor-pointer appearance-none rounded-full border border-moss-600/15 bg-bone py-2 pl-4 pr-9 text-sm text-ink outline-none"
            >
              <option value="featured">Destacadas</option>
              <option value="price-asc">Menor precio</option>
              <option value="price-desc">Mayor precio</option>
              <option value="area-desc">Más superficie</option>
            </select>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-moss-600" aria-hidden>
              <path d="m6 9 6 6 6-6" />
            </svg>
          </label>
        </div>
        <div className="no-scrollbar -mx-6 mt-2.5 flex items-center gap-2 overflow-x-auto px-6">
          <span className="shrink-0 pr-1 text-xs text-ink-soft/65" aria-live="polite">
            {countLabel}
          </span>
          {chips.map((c) => (
              <button
                key={c.label}
                type="button"
                onClick={c.clear}
                aria-label={`Quitar filtro ${c.label}`}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-mint-100 py-1.5 pl-3 pr-2 text-xs text-moss-700"
              >
                {c.label}
                <span aria-hidden className="text-sm leading-none text-moss-600/70">×</span>
              </button>
          ))}
        </div>
      </div>

      {/* Panel de filtros (celular) */}
      {sheet && (
        <div className="fixed inset-0 z-[70] md:hidden" role="dialog" aria-modal="true" aria-label="Filtros">
          <button
            type="button"
            aria-label="Cerrar filtros"
            onClick={() => setSheet(false)}
            className="nua-sheet-backdrop absolute inset-0 bg-moss-900/40 backdrop-blur-[2px]"
          />
          <div
            data-lenis-prevent
            className="nua-sheet absolute inset-x-0 bottom-0 max-h-[88vh] overflow-y-auto rounded-t-[1.75rem] bg-bone px-6 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-3 shadow-[0_-20px_50px_-20px_rgba(36,41,15,0.5)]"
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-moss-600/20" aria-hidden />
            <div className="mb-6 flex items-center justify-between">
              <p className="font-display text-2xl text-ink">Filtros</p>
              {hasFilters && (
                <button type="button" onClick={reset} className="text-sm text-moss-600 underline underline-offset-4">
                  Limpiar todo
                </button>
              )}
            </div>
            <div className="grid gap-5 [&_select]:w-full">{filterFields}</div>
            <button
              type="button"
              onClick={() => setSheet(false)}
              className="mt-8 flex min-h-12 w-full items-center justify-center rounded-full bg-moss-600 px-6 text-sm font-medium text-mint-100"
            >
              {results.length === 0 ? "Sin resultados: probá otros filtros" : `Ver ${countLabel}`}
            </button>
          </div>
        </div>
      )}

      {/* Compu y tablet: barra completa */}
      <div className="z-30 hidden rounded-3xl border border-moss-600/10 bg-bone/80 p-4 backdrop-blur-xl md:sticky md:top-24 md:block md:p-5">
        <div className="flex flex-wrap items-end gap-4">
          {filterFields}
          <Select
            label="Ordenar"
            value={sort}
            onChange={(v) => setSort(v as SortKey)}
            options={[
              ["featured", "Destacadas"],
              ["price-asc", "Precio ↑"],
              ["price-desc", "Precio ↓"],
              ["area-desc", "Superficie ↓"],
            ]}
          />
          <div className="ml-auto flex items-center gap-4 pb-1">
            <span className="text-sm text-ink-soft/70">{countLabel}</span>
            {hasFilters && (
              <button
                onClick={reset}
                className="text-sm text-moss-600 underline-offset-4 hover:underline"
              >
                Limpiar
              </button>
            )}
          </div>
        </div>
      </div>

      <h2 className="sr-only">Resultados</h2>

      {/* Grid */}
      {results.length > 0 ? (
        <div className="mt-12 grid grid-cols-1 gap-x-6 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((p, i) => (
            <PropertyCard key={p.slug} property={p} index={i} eager={i < 2} />
          ))}
        </div>
      ) : (
        <div className="mt-24 flex flex-col items-center gap-4 py-16 text-center">
          <p className="font-display text-3xl text-ink">
            No encontramos propiedades
          </p>
          <p className="max-w-md text-ink-soft/70">
            {effectiveType !== "all"
              ? `En este momento no hay propiedades de tipo «${TYPE_LABELS[effectiveType]}» publicadas, pero nos llegan nuevas seguido. Contanos qué buscás y te avisamos.`
              : "Probá ajustando los filtros o escribinos y buscamos la opción ideal para vos."}
          </p>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
            {phoneHref && (
              <a
                href={`https://wa.me/${phoneHref}?text=${encodeURIComponent(
                  effectiveType !== "all"
                    ? `Hola NÚA, estoy buscando una propiedad de tipo «${TYPE_LABELS[effectiveType]}». ¿Me avisan si les ingresa algo?`
                    : "Hola NÚA, estoy buscando una propiedad. ¿Me pueden ayudar?"
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center rounded-full bg-moss-600 px-6 py-3 text-sm text-mint-100 transition-colors hover:bg-moss-700"
              >
                Escribinos por WhatsApp
              </a>
            )}
            <button
              onClick={reset}
              className="min-h-11 rounded-full border border-moss-600/20 px-6 py-3 text-sm text-moss-600 transition-colors hover:bg-mint-100"
            >
              Ver todas
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: [string, string][];
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[10px] uppercase tracking-[0.2em] text-sage-500">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full cursor-pointer rounded-full border border-moss-600/15 bg-bone px-4 py-2.5 text-sm text-ink outline-none transition-colors hover:border-moss-600/40 focus:border-moss-600 sm:w-auto"
      >
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </label>
  );
}
