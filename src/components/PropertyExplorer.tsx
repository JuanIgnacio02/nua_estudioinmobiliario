"use client";

import { useMemo, useState } from "react";
import {
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

export default function PropertyExplorer({
  properties,
  zones,
  initialType,
}: {
  properties: Property[];
  zones: string[];
  initialType?: PropertyType;
}) {
  const [operation, setOperation] = useState<Operation | "all">("all");
  const [type, setType] = useState<PropertyType | "all">(initialType ?? "all");
  const [zone, setZone] = useState<string>("all");
  const [sort, setSort] = useState<SortKey>("featured");

  const results = useMemo(() => {
    let list = properties.filter((p) => {
      if (operation !== "all" && p.operation !== operation) return false;
      if (type !== "all" && p.type !== type) return false;
      if (zone !== "all" && p.zone !== zone) return false;
      return true;
    });
    list = [...list].sort((a, b) => {
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
  }, [properties, operation, type, zone, sort]);

  const reset = () => {
    setOperation("all");
    setType("all");
    setZone("all");
    setSort("featured");
  };

  const hasFilters =
    operation !== "all" || type !== "all" || zone !== "all";

  return (
    <div className="mx-auto max-w-7xl px-6 md:px-10">
      {/* Filter bar */}
      <div className="sticky top-24 z-30 rounded-3xl border border-moss-600/10 bg-bone/80 p-4 backdrop-blur-xl md:p-5">
        <div className="flex flex-wrap items-end gap-4">
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
            value={type}
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
          <div className="ml-auto flex items-center gap-4 pb-1">
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

      {/* Grid */}
      {results.length > 0 ? (
        <div className="mt-12 grid grid-cols-1 gap-x-6 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((p, i) => (
            <PropertyCard key={p.slug} property={p} index={i} priority={i < 3} />
          ))}
        </div>
      ) : (
        <div className="mt-24 flex flex-col items-center gap-4 py-16 text-center">
          <p className="font-display text-3xl text-ink">
            No encontramos propiedades
          </p>
          <p className="max-w-sm text-ink-soft/70">
            Probá ajustando los filtros o escribinos y buscamos la opción ideal
            para vos.
          </p>
          <button
            onClick={reset}
            className="mt-2 rounded-full bg-moss-600 px-6 py-3 text-sm text-mint-100 transition-colors hover:bg-moss-700"
          >
            Ver todas
          </button>
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
        className="cursor-pointer rounded-full border border-moss-600/15 bg-bone px-4 py-2.5 text-sm text-ink outline-none transition-colors hover:border-moss-600/40 focus:border-moss-600"
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
