"use client";

import { useMemo, useSyncExternalStore } from "react";
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

  const setOperation = (v: Operation | "all") =>
    writeParams({ operacion: v === "all" ? null : v });
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
  }, [properties, operation, effectiveType, zone, sort]);

  const reset = () =>
    writeParams({ operacion: null, tipo: null, zona: null, orden: null });

  // effectiveType y no `type`: `type` arranca en null ("todavía no eligió"),
  // y comparar null con "all" mostraba "Limpiar" sin ningún filtro activo.
  const hasFilters =
    operation !== "all" || effectiveType !== "all" || zone !== "all";

  return (
    <div className="mx-auto max-w-7xl px-6 md:px-10">
      {/* Filter bar */}
      <div className="z-30 rounded-3xl border border-moss-600/10 bg-bone/80 p-4 backdrop-blur-xl md:sticky md:top-24 md:p-5">
        <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:items-end sm:gap-4">
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
            options={[
              ["all", "Todas"],
              ...zones.map((z) => [z, z] as [string, string]),
            ]}
          />
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
          <div className="col-span-2 flex items-center gap-4 pb-1 sm:col-span-1 sm:ml-auto">
            <span className="text-sm text-ink-soft/70">
              {results.length}{" "}
              {results.length === 1 ? "propiedad" : "propiedades"}
            </span>
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
