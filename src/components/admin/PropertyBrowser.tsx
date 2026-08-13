"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  formatPrice,
  formatArea,
  TYPE_LABELS,
  OPERATION_LABELS,
  type Property,
  type PropertyType,
  type Operation,
} from "@/lib/properties";
import { deletePropertyAction } from "@/app/admin/actions";

type EstadoFiltro = "todas" | "publicadas" | "borradores";

/** Normaliza para buscar sin acentos ni mayúsculas. */
function norm(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

export default function PropertyBrowser({
  properties,
}: {
  properties: Property[];
}) {
  const [q, setQ] = useState("");
  const [tipo, setTipo] = useState<PropertyType | "todos">("todos");
  const [operacion, setOperacion] = useState<Operation | "todas">("todas");
  const [estado, setEstado] = useState<EstadoFiltro>("todas");

  const filtradas = useMemo(() => {
    const term = norm(q.trim());
    return properties.filter((p) => {
      if (tipo !== "todos" && p.type !== tipo) return false;
      if (operacion !== "todas" && p.operation !== operacion) return false;
      if (estado === "publicadas" && p.draft) return false;
      if (estado === "borradores" && !p.draft) return false;
      if (!term) return true;
      return norm(
        `${p.title} ${p.zone} ${p.city} ${p.location}`
      ).includes(term);
    });
  }, [properties, q, tipo, operacion, estado]);

  const hayFiltros =
    q.trim() !== "" ||
    tipo !== "todos" ||
    operacion !== "todas" ||
    estado !== "todas";

  const limpiar = () => {
    setQ("");
    setTipo("todos");
    setOperacion("todas");
    setEstado("todas");
  };

  return (
    <>
      {/* Barra de búsqueda y filtros */}
      <div className="glass-panel mt-8 p-4 md:p-5">
        <div className="relative">
          <svg
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-soft/40"
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por título, zona, ciudad o dirección…"
            className="admin-input pl-10"
            aria-label="Buscar propiedades"
          />
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <select
            value={operacion}
            onChange={(e) =>
              setOperacion(e.target.value as Operation | "todas")
            }
            className="admin-input w-auto py-2 text-sm"
            aria-label="Filtrar por operación"
          >
            <option value="todas">Toda operación</option>
            {(Object.keys(OPERATION_LABELS) as Operation[]).map((o) => (
              <option key={o} value={o}>
                {OPERATION_LABELS[o]}
              </option>
            ))}
          </select>

          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value as PropertyType | "todos")}
            className="admin-input w-auto py-2 text-sm"
            aria-label="Filtrar por tipo"
          >
            <option value="todos">Todo tipo</option>
            {(Object.keys(TYPE_LABELS) as PropertyType[]).map((t) => (
              <option key={t} value={t}>
                {TYPE_LABELS[t]}
              </option>
            ))}
          </select>

          <div className="glass-segment">
            {(
              [
                ["todas", "Todas"],
                ["publicadas", "Publicadas"],
                ["borradores", "Borradores"],
              ] as const
            ).map(([v, label]) => (
              <button
                key={v}
                type="button"
                onClick={() => setEstado(v)}
                aria-pressed={estado === v}
                className={`glass-segment__btn ${
                  estado === v ? "is-active" : ""
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {hayFiltros && (
            <button type="button" onClick={limpiar} className="glass-btn">
              Limpiar
            </button>
          )}
        </div>

        <p className="mt-3 text-xs text-ink-soft/60">
          {filtradas.length === properties.length
            ? `${properties.length} propiedades`
            : `${filtradas.length} de ${properties.length} propiedades`}
        </p>
      </div>

      {/* Resultados */}
      <div className="mt-4 space-y-3">
        {filtradas.map((p) => (
          <div
            key={p.slug}
            className="glass-panel glass-card flex items-center gap-4 p-3"
          >
            <div className="relative h-16 w-20 shrink-0 overflow-hidden rounded-xl bg-bone-dark">
              <Image
                src={p.image}
                alt={p.title}
                fill
                className="object-cover"
                sizes="80px"
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate font-medium text-ink">{p.title}</p>
                {p.draft && (
                  <span className="glass-chip glass-chip--draft">Borrador</span>
                )}
                {p.featured && !p.draft && (
                  <span className="glass-chip">★ Portada</span>
                )}
              </div>
              <p className="mt-0.5 text-xs text-sage-600">
                {OPERATION_LABELS[p.operation]} · {TYPE_LABELS[p.type]} ·{" "}
                {formatArea(p.area)} · {p.zone}
                {!p.coords && " · ⚠ sin mapa"}
              </p>
            </div>
            <span className="hidden shrink-0 font-display text-lg text-moss-700 sm:block">
              {formatPrice(p)}
            </span>
            <div className="flex shrink-0 items-center gap-1">
              <Link
                href={`/admin/propiedades/${p.slug}`}
                className="rounded-full px-4 py-2 text-sm text-moss-700 transition-colors hover:bg-white/70"
              >
                Editar
              </Link>
              <form action={deletePropertyAction}>
                <input type="hidden" name="slug" value={p.slug} />
                <button
                  type="submit"
                  className="rounded-full px-3 py-2 text-sm text-ink-soft/50 transition-colors hover:bg-red-500/10 hover:text-red-600"
                  title="Borrar"
                >
                  Borrar
                </button>
              </form>
            </div>
          </div>
        ))}

        {filtradas.length === 0 && (
          <div className="glass-panel px-6 py-16 text-center">
            <p className="text-ink-soft/70">
              {properties.length === 0
                ? "Todavía no hay propiedades. Creá la primera."
                : "Ninguna propiedad coincide con la búsqueda."}
            </p>
            {hayFiltros && properties.length > 0 && (
              <button
                type="button"
                onClick={limpiar}
                className="glass-btn mt-4"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );
}
