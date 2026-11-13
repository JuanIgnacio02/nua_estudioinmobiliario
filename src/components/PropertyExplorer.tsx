"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import {
  saleRank,
  isOperation,
  isPropertyType,
  TYPE_LABELS,
  TYPE_GROUPS,
  OPERATION_LABELS,
  type Operation,
  type PropertyType,
  type Property,
} from "@/lib/properties";
import PropertyCard from "@/components/PropertyCard";
import { menuColumns } from "@/lib/menu";

type SortKey = "featured" | "price-asc" | "price-desc" | "area-desc";

const OPERATIONS = Object.keys(OPERATION_LABELS) as Operation[];
const SORTS: SortKey[] = ["featured", "price-asc", "price-desc", "area-desc"];
const SORT_LABELS: Record<SortKey, string> = {
  featured: "Destacadas",
  "price-asc": "Menor precio",
  "price-desc": "Mayor precio",
  "area-desc": "Más superficie",
};

/*
 * Rangos de precio. Venta y alquiler tienen escalas muy distintas, así que
 * cada operación tiene los suyos; elegir un rango implica esa operación.
 * Las propiedades "Consultar" (sin precio) no entran en ningún rango.
 * El alquiler temporal no tiene: mezcla precios por noche, semana y mes.
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

type Facets = {
  operation: Operation | "all";
  type: PropertyType | "all";
  zone: string;
  range: Range | null;
  beds: number;
};

/** Cumple los filtros. `skip` ignora uno: así se cuenta cuántas hay en cada
 *  opción de ese filtro sin que la opción elegida deje todo en cero. */
function matches(p: Property, f: Facets, skip?: keyof Facets) {
  if (skip !== "operation" && f.operation !== "all" && p.operation !== f.operation) return false;
  if (skip !== "type" && f.type !== "all" && p.type !== f.type) return false;
  if (skip !== "zone" && f.zone !== "all" && p.zone !== f.zone) return false;
  if (skip !== "range" && f.range) {
    if (p.operation !== f.range.op || !p.price) return false;
    if (p.price < f.range.min || p.price >= f.range.max) return false;
  }
  if (skip !== "beds" && f.beds && (p.bedrooms ?? 0) < f.beds) return false;
  return true;
}

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
  for (const [key, v] of Object.entries(changes)) {
    if (v === null) url.searchParams.delete(key);
    else url.searchParams.set(key, v);
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

  // Menú abierto de la barra de compu. Se cierra al tocar afuera o con Esc
  // (y el foco vuelve al botón que lo abrió).
  const [menu, setMenu] = useState<string | null>(null);
  const barRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!menu) return;
    const onDown = (e: PointerEvent) => {
      if (!barRef.current?.contains(e.target as Node)) setMenu(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      barRef.current?.querySelector<HTMLButtonElement>('[aria-expanded="true"]')?.focus();
      setMenu(null);
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [menu]);

  const search = useSyncExternalStore(
    subscribe,
    () => window.location.search,
    () => ""
  );
  const params = new URLSearchParams(search);

  const rawType = params.get("tipo") ?? params.get("type");
  const effectiveType: PropertyType | "all" = isPropertyType(rawType) ? rawType : "all";
  const rawOp = params.get("operacion");
  const operation: Operation | "all" = isOperation(rawOp) ? rawOp : "all";
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
  const rangeOptions =
    operation === "temporal"
      ? []
      : RANGES.filter((r) => r.op === (operation === "all" ? "venta" : operation));

  const facets: Facets = { operation, type: effectiveType, zone, range, beds };
  /** Cuántas quedarían eligiendo esa opción (con el resto de los filtros). */
  const count = (skip: keyof Facets, test: (p: Property) => boolean) =>
    properties.filter((p) => test(p) && matches(p, facets, skip)).length;

  // Tipos agrupados, solo los que hay publicados: son muchos y una lista
  // llena de opciones que dan vacío no sirve. El elegido por URL se ofrece igual.
  const typeGroups = TYPE_GROUPS.map((g) => ({
    label: g.label,
    types: g.types.filter((t) => t === effectiveType || properties.some((p) => p.type === t)),
  })).filter((g) => g.types.length > 0);
  const typeCount = typeGroups.reduce((n, g) => n + g.types.length, 0);

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

  const results = properties
    .filter((p) => matches(p, facets))
    .sort((a, b) => {
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

  const reset = () =>
    writeParams({
      operacion: null,
      tipo: null,
      zona: null,
      orden: null,
      precio: null,
      dormitorios: null,
    });

  const hasFilters =
    operation !== "all" ||
    effectiveType !== "all" ||
    zone !== "all" ||
    range !== null ||
    beds > 0;

  // Filtros activos como chips que se quitan con un toque.
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
  const priceHeading = operation === "alquiler" ? "Alquiler por mes" : "Venta";
  // Con muchos tipos o zonas, el menú va en columnas (más cuadrado, sin scroll).
  const typeCols = menuColumns(typeCount + (typeGroups.length > 1 ? typeGroups.length : 0));
  const zoneCols = menuColumns(zones.length);

  /* --------------------- Celular: opciones como chips --------------------- */
  const sheetFields = (
    <div className="space-y-7">
      <ChipSection title="Operación">
        <Chip selected={operation === "all"} onClick={() => setOperation("all")}>
          Todas
        </Chip>
        {OPERATIONS.map((o) => (
          <Chip
            key={o}
            selected={operation === o}
            onClick={() => setOperation(o)}
            count={count("operation", (p) => p.operation === o)}
          >
            {OPERATION_LABELS[o]}
          </Chip>
        ))}
      </ChipSection>

      <ChipSection title="Tipo">
        <Chip selected={effectiveType === "all"} onClick={() => setType("all")}>
          Todos
        </Chip>
        {typeGroups.map((g) => (
          <ChipGroup key={g.label} label={typeCount > 6 && typeGroups.length > 1 ? g.label : null}>
            {g.types.map((t) => (
              <Chip
                key={t}
                selected={effectiveType === t}
                onClick={() => setType(t)}
                count={count("type", (p) => p.type === t)}
              >
                {TYPE_LABELS[t]}
              </Chip>
            ))}
          </ChipGroup>
        ))}
      </ChipSection>

      <ChipSection title="Zona">
        <Chip selected={zone === "all"} onClick={() => setZone("all")}>
          Todas
        </Chip>
        {zones.map((z) => (
          <Chip
            key={z}
            selected={zone === z}
            onClick={() => setZone(z)}
            count={count("zone", (p) => p.zone === z)}
          >
            {z}
          </Chip>
        ))}
      </ChipSection>

      {rangeOptions.length > 0 && (
        <ChipSection title={`Precio · ${priceHeading.toLowerCase()}`}>
          <Chip selected={!range} onClick={() => setRange("all")}>
            Cualquiera
          </Chip>
          {rangeOptions.map((r) => (
            <Chip key={r.key} selected={range?.key === r.key} onClick={() => setRange(r.key)}>
              {r.label}
            </Chip>
          ))}
        </ChipSection>
      )}

      <ChipSection title="Dormitorios">
        <Chip selected={!beds} onClick={() => setBeds("all")}>
          Todos
        </Chip>
        {BEDS.map((b) => (
          <Chip key={b} selected={beds === Number(b)} onClick={() => setBeds(b)}>
            {b} o más
          </Chip>
        ))}
      </ChipSection>
    </div>
  );

  /* ------------------ Compu: menús propios de la barra ------------------ */
  const menuProps = (id: string) => ({
    id,
    open: menu === id,
    onToggle: () => setMenu(menu === id ? null : id),
  });
  // Elegir una opción la aplica y cierra el menú.
  const choose = (fn: () => void) => () => {
    fn();
    setMenu(null);
  };

  return (
    <div className="mx-auto max-w-7xl px-6 md:px-10">
      {/* Celular: barra compacta fija + panel de filtros desde abajo. */}
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
              {SORTS.map((s) => (
                <option key={s} value={s}>
                  {SORT_LABELS[s]}
                </option>
              ))}
            </select>
            <ChevronIcon className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-moss-600" />
          </label>
        </div>
        <div className="no-scrollbar -mx-6 mt-2.5 flex items-center gap-2 overflow-x-auto px-6">
          <span className="shrink-0 pr-1 text-xs text-ink-soft/80" aria-live="polite">
            {countLabel}
          </span>
          {chips.map((c) => (
            <ActiveChip key={c.label} label={c.label} onClear={c.clear} />
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
            className="nua-sheet absolute inset-x-0 bottom-0 flex max-h-[88vh] flex-col rounded-t-[1.75rem] bg-bone shadow-[0_-20px_50px_-20px_rgba(36,41,15,0.5)]"
          >
            <div className="px-6 pt-3">
              <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-moss-600/20" aria-hidden />
              <div className="mb-5 flex items-center justify-between">
                <p className="font-display text-2xl text-ink">Filtros</p>
                {hasFilters && (
                  <button type="button" onClick={reset} className="text-sm text-moss-600 underline underline-offset-4">
                    Limpiar todo
                  </button>
                )}
              </div>
            </div>
            {/* Las opciones scrollean; el botón de abajo queda siempre a mano. */}
            <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-4">{sheetFields}</div>
            <div className="border-t border-moss-600/10 px-6 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4">
              <button
                type="button"
                onClick={() => setSheet(false)}
                className="flex min-h-12 w-full items-center justify-center rounded-full bg-moss-600 px-6 text-sm font-medium text-mint-100"
              >
                {results.length === 0 ? "Sin resultados: probá otros filtros" : `Ver ${countLabel}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Compu y tablet: barra fija con menús propios (los selectores del
          sistema mostraban la letra y el azul de Windows). */}
      <div
        ref={barRef}
        className="z-30 hidden rounded-[1.75rem] border border-moss-600/10 bg-bone/85 p-2 shadow-[0_18px_40px_-32px_rgba(36,41,15,0.45)] backdrop-blur-xl md:sticky md:top-24 md:block"
      >
        <div className="flex flex-wrap lg:flex-nowrap">
          <FilterMenu
            {...menuProps("operacion")}
            label="Operación"
            value={operation === "all" ? "Todas" : OPERATION_LABELS[operation]}
            active={operation !== "all"}
          >
            <MenuOption selected={operation === "all"} onClick={choose(() => setOperation("all"))}>
              Todas
            </MenuOption>
            {OPERATIONS.map((o) => (
              <MenuOption
                key={o}
                selected={operation === o}
                count={count("operation", (p) => p.operation === o)}
                onClick={choose(() => setOperation(o))}
              >
                {OPERATION_LABELS[o]}
              </MenuOption>
            ))}
          </FilterMenu>

          <FilterMenu
            {...menuProps("tipo")}
            divider
            cols={typeCols}
            label="Tipo"
            value={effectiveType === "all" ? "Todos" : TYPE_LABELS[effectiveType]}
            active={effectiveType !== "all"}
          >
            <MenuOption selected={effectiveType === "all"} onClick={choose(() => setType("all"))}>
              Todos los tipos
            </MenuOption>
            <div className={COLUMN_CLASS[typeCols]}>
              {typeGroups.map((g) => (
                <div key={g.label} className="break-inside-avoid">
                  {typeGroups.length > 1 && <MenuHeading>{g.label}</MenuHeading>}
                  {g.types.map((t) => (
                    <MenuOption
                      key={t}
                      selected={effectiveType === t}
                      count={count("type", (p) => p.type === t)}
                      onClick={choose(() => setType(t))}
                    >
                      {TYPE_LABELS[t]}
                    </MenuOption>
                  ))}
                </div>
              ))}
            </div>
          </FilterMenu>

          <FilterMenu
            {...menuProps("zona")}
            divider
            cols={zoneCols}
            label="Zona"
            value={zone === "all" ? "Todas" : zone}
            active={zone !== "all"}
          >
            <MenuOption selected={zone === "all"} onClick={choose(() => setZone("all"))}>
              Todas las zonas
            </MenuOption>
            <div className={COLUMN_CLASS[zoneCols]}>
              {zones.map((z) => (
                <MenuOption
                  key={z}
                  selected={zone === z}
                  count={count("zone", (p) => p.zone === z)}
                  onClick={choose(() => setZone(z))}
                >
                  {z}
                </MenuOption>
              ))}
            </div>
          </FilterMenu>

          {rangeOptions.length > 0 && (
            <FilterMenu
              {...menuProps("precio")}
              divider
              label="Precio"
              value={range ? range.label : "Cualquiera"}
              active={range !== null}
            >
              <MenuOption selected={!range} onClick={choose(() => setRange("all"))}>
                Cualquier precio
              </MenuOption>
              <MenuHeading>{priceHeading}</MenuHeading>
              {rangeOptions.map((r) => (
                <MenuOption
                  key={r.key}
                  selected={range?.key === r.key}
                  onClick={choose(() => setRange(r.key))}
                >
                  {r.label}
                </MenuOption>
              ))}
            </FilterMenu>
          )}

          <FilterMenu
            {...menuProps("dormitorios")}
            divider
            label="Dormitorios"
            value={beds ? `${beds} o más` : "Todos"}
            active={beds > 0}
          >
            <MenuOption selected={!beds} onClick={choose(() => setBeds("all"))}>
              Todos
            </MenuOption>
            {BEDS.map((b) => (
              <MenuOption
                key={b}
                selected={beds === Number(b)}
                onClick={choose(() => setBeds(b))}
              >
                {b} o más
              </MenuOption>
            ))}
          </FilterMenu>

          <FilterMenu
            {...menuProps("orden")}
            divider
            align="right"
            label="Ordenar"
            value={SORT_LABELS[sort]}
            active={false}
          >
            {SORTS.map((s) => (
              <MenuOption key={s} selected={sort === s} onClick={choose(() => setSort(s))}>
                {SORT_LABELS[s]}
              </MenuOption>
            ))}
          </FilterMenu>
        </div>
      </div>

      {/* Compu: cantidad y filtros activos, debajo de la barra. */}
      <div className="mt-5 hidden min-h-8 flex-wrap items-center gap-2 md:flex">
        <span className="pr-2 text-sm text-ink-soft/70" aria-live="polite">
          {countLabel}
        </span>
        {chips.map((c) => (
          <ActiveChip key={c.label} label={c.label} onClear={c.clear} />
        ))}
        {hasFilters && (
          <button
            type="button"
            onClick={reset}
            className="ml-1 text-sm text-moss-600 underline-offset-4 hover:underline"
          >
            Limpiar todo
          </button>
        )}
      </div>

      <h2 className="sr-only">Resultados</h2>

      {/* Grid */}
      {results.length > 0 ? (
        <div className="mt-12 grid grid-cols-1 gap-x-6 gap-y-14 sm:grid-cols-2 md:mt-8 lg:grid-cols-3">
          {results.map((p, i) => (
            <PropertyCard key={p.slug} property={p} index={i} eager={i < 2} priority={i === 0} />
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

/* ------------------------------ piezas ------------------------------ */

/** Columnas del contenido y ancho del menú según cuántas columnas lleva. */
const COLUMN_CLASS: Record<number, string> = {
  1: "",
  2: "columns-2 gap-1 [&>*]:break-inside-avoid",
  3: "columns-2 gap-1 lg:columns-3 [&>*]:break-inside-avoid",
};
const MENU_WIDTH: Record<number, string> = {
  1: "w-64",
  2: "w-[30rem]",
  3: "w-[30rem] lg:w-[42rem]",
};

function ChevronIcon({ className = "" }: { className?: string }) {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function ActiveChip({ label, onClear }: { label: string; onClear: () => void }) {
  return (
    <button
      type="button"
      onClick={onClear}
      aria-label={`Quitar filtro ${label}`}
      className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-mint-100 py-1.5 pl-3 pr-2 text-xs text-moss-700 transition-colors hover:bg-mint-100/70"
    >
      {label}
      <span aria-hidden className="text-sm leading-none text-moss-600/70">
        ×
      </span>
    </button>
  );
}

/** Casillero de la barra: rótulo chico arriba y el valor elegido en la
 *  tipografía de los títulos; al tocarlo abre su menú. */
function FilterMenu({
  id,
  label,
  value,
  active,
  open,
  onToggle,
  divider = false,
  cols = 1,
  align = "left",
  children,
}: {
  id: string;
  label: string;
  value: string;
  active: boolean;
  open: boolean;
  onToggle: () => void;
  divider?: boolean;
  /** Columnas del menú (con muchas opciones, más ancho y menos alto). */
  cols?: number;
  align?: "left" | "right";
  children: ReactNode;
}) {
  const panelId = `filtro-${id}`;
  return (
    <div
      className={`relative min-w-[9.5rem] flex-1 ${
        divider
          ? "lg:before:absolute lg:before:inset-y-3 lg:before:left-0 lg:before:w-px lg:before:bg-moss-600/10 lg:before:content-['']"
          : ""
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={panelId}
        title={value}
        className={`flex w-full flex-col items-start gap-1 rounded-[1.25rem] px-5 py-2.5 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-moss-600/30 ${
          open ? "bg-white shadow-[0_6px_18px_-12px_rgba(36,41,15,0.4)]" : "hover:bg-white/60"
        }`}
      >
        <span className="text-[10px] uppercase tracking-[0.2em] text-sage-500">{label}</span>
        <span className="flex w-full items-center gap-2">
          <span
            className={`truncate font-display text-[1.05rem] leading-snug ${
              active ? "text-moss-600" : "text-ink"
            }`}
          >
            {value}
          </span>
          <ChevronIcon
            className={`ml-auto shrink-0 text-moss-600/55 transition-transform duration-200 ${
              open ? "rotate-180" : ""
            }`}
          />
        </span>
      </button>
      {open && (
        <div
          id={panelId}
          aria-label={label}
          data-lenis-prevent
          className={`nua-pop absolute top-[calc(100%+0.6rem)] z-40 max-h-[min(70vh,34rem)] overflow-y-auto rounded-3xl border border-moss-600/10 bg-bone p-2 shadow-[0_28px_60px_-28px_rgba(36,41,15,0.5)] ${
            align === "right" ? "right-0 origin-top-right" : "left-0 origin-top-left"
          } ${MENU_WIDTH[cols] ?? MENU_WIDTH[1]} max-w-[calc(100vw-2rem)]`}
        >
          {children}
        </div>
      )}
    </div>
  );
}

function MenuHeading({ children }: { children: ReactNode }) {
  return (
    <p className="px-3.5 pb-1 pt-3 text-[10px] uppercase tracking-[0.2em] text-sage-500">
      {children}
    </p>
  );
}

function MenuOption({
  selected,
  count,
  onClick,
  children,
}: {
  selected: boolean;
  count?: number;
  onClick: () => void;
  children: ReactNode;
}) {
  const empty = count === 0 && !selected;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`flex w-full items-center gap-3 rounded-2xl px-3.5 py-2.5 text-left text-sm transition-colors ${
        selected
          ? "bg-mint-100 font-medium text-moss-700"
          : empty
            ? "text-ink-soft/40 hover:bg-white"
            : "text-ink hover:bg-white"
      }`}
    >
      <span className="min-w-0 flex-1">{children}</span>
      {selected ? (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="shrink-0" aria-hidden>
          <path d="M20 6 9 17l-5-5" />
        </svg>
      ) : count != null ? (
        <span className="shrink-0 text-xs tabular-nums text-ink-soft/45">{count}</span>
      ) : null}
    </button>
  );
}

function ChipSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset>
      <legend className="mb-3 text-[10px] uppercase tracking-[0.2em] text-sage-500">{title}</legend>
      <div className="flex flex-wrap gap-2">{children}</div>
    </fieldset>
  );
}

/** Subgrupo dentro de una sección de chips (Viviendas, Comerciales…). */
function ChipGroup({ label, children }: { label: string | null; children: ReactNode }) {
  if (!label) return <>{children}</>;
  return (
    <>
      <p className="basis-full pt-2 text-xs text-ink-soft/55">{label}</p>
      {children}
    </>
  );
}

function Chip({
  selected,
  count,
  onClick,
  children,
}: {
  selected: boolean;
  count?: number;
  onClick: () => void;
  children: ReactNode;
}) {
  const empty = count === 0 && !selected;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`inline-flex min-h-10 items-center gap-1.5 rounded-full border px-4 text-sm transition-colors ${
        selected
          ? "border-moss-600 bg-moss-600 text-mint-100"
          : empty
            ? "border-moss-600/10 text-ink-soft/40"
            : "border-moss-600/15 bg-white/50 text-ink active:bg-mint-100"
      }`}
    >
      {children}
      {count != null && (
        <span className={`text-xs tabular-nums ${selected ? "text-mint-100/70" : "text-ink-soft/45"}`}>
          {count}
        </span>
      )}
    </button>
  );
}
