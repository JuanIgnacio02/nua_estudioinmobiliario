"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  saleStatus,
  saleStatusLabel,
  isNew,
  priceDrop,
  propertyImages,
  formatPrice,
  formatArea,
  TYPE_LABELS,
  OPERATION_LABELS,
  type Property,
  type PropertyType,
  type Operation,
} from "@/lib/properties";
import { deletePropertyAction } from "@/app/admin/actions";
import DeleteButton from "./DeleteButton";
import DuplicateButton from "./DuplicateButton";
import SocialKitButton from "./SocialKit";
import AdminSelect from "./AdminSelect";

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
      return norm(`${p.title} ${p.zone} ${p.city} ${p.location}`).includes(term);
    });
  }, [properties, q, tipo, operacion, estado]);

  const hayFiltros =
    q.trim() !== "" || tipo !== "todos" || operacion !== "todas" || estado !== "todas";

  const limpiar = () => {
    setQ("");
    setTipo("todos");
    setOperacion("todas");
    setEstado("todas");
  };

  // Solo se ofrecen los tipos que existen: un filtro que da vacío no sirve.
  const tiposUsados = (Object.keys(TYPE_LABELS) as PropertyType[]).filter((t) =>
    properties.some((p) => p.type === t)
  );

  return (
    <>
      {/* Barra de búsqueda y filtros */}
      <div className="glass-panel mt-8 p-3 md:p-4">
        <div className="flex flex-col gap-2.5 md:flex-row md:items-center">
          <div className="relative flex-1">
            <svg
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-soft/45"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por título, zona o dirección…"
              className="admin-input pl-10"
              aria-label="Buscar propiedades"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5 md:flex">
            <AdminSelect
              value={operacion}
              onChange={(v) => setOperacion(v as Operation | "todas")}
              className="text-sm md:w-auto md:min-w-[10rem]"
              ariaLabel="Filtrar por operación"
              emptyValue="todas"
              placeholder="Operación"
              options={[
                { value: "todas", label: "Todas las operaciones" },
                ...(Object.keys(OPERATION_LABELS) as Operation[]).map((o) => ({
                  value: o,
                  label: OPERATION_LABELS[o],
                })),
              ]}
            />
            <AdminSelect
              value={tipo}
              onChange={(v) => setTipo(v as PropertyType | "todos")}
              className="text-sm md:w-auto md:min-w-[10rem]"
              ariaLabel="Filtrar por tipo"
              emptyValue="todos"
              placeholder="Tipo"
              options={[
                { value: "todos", label: "Todos los tipos" },
                ...tiposUsados.map((t) => ({ value: t, label: TYPE_LABELS[t] })),
              ]}
            />
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <div className="glass-segment" role="group" aria-label="Filtrar por estado">
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
                className={`glass-segment__btn ${estado === v ? "is-active" : ""}`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <p className="text-xs text-ink-soft/60" aria-live="polite">
              {filtradas.length === properties.length
                ? `${properties.length} ${properties.length === 1 ? "propiedad" : "propiedades"}`
                : `${filtradas.length} de ${properties.length}`}
            </p>
            {hayFiltros && (
              <button
                type="button"
                onClick={limpiar}
                className="rounded-full px-3 py-1.5 text-xs font-medium text-moss-700 transition-colors hover:bg-white/70"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Resultados */}
      <ul className="mt-4 space-y-2.5">
        {filtradas.map((p) => (
          <PropertyRow key={p.slug} p={p} />
        ))}
      </ul>

      {filtradas.length === 0 && (
        <div className="glass-panel mt-4 px-6 py-16 text-center">
          <p className="text-ink-soft/70">
            {properties.length === 0
              ? "Todavía no hay propiedades cargadas."
              : "Ninguna propiedad coincide con la búsqueda."}
          </p>
          {properties.length === 0 ? (
            <Link href="/admin/propiedades/nueva" className="glass-btn-primary mt-5">
              + Cargar la primera
            </Link>
          ) : (
            hayFiltros && (
              <button type="button" onClick={limpiar} className="glass-btn mt-5">
                Limpiar filtros
              </button>
            )
          )}
        </div>
      )}
    </>
  );
}

function PropertyRow({ p }: { p: Property }) {
  const status = saleStatus(p);
  const editHref = `/admin/propiedades/${p.slug}`;
  return (
    <li className="glass-panel glass-card group relative flex items-center gap-3 p-2.5 pr-2 md:gap-4 md:p-3">
      <div className="relative h-16 w-[4.5rem] shrink-0 overflow-hidden rounded-xl bg-bone-dark md:h-[4.25rem] md:w-24">
        <Image
          src={p.image}
          alt=""
          fill
          className={`object-cover ${status === "vendida" ? "grayscale-[60%]" : ""}`}
          sizes="96px"
        />
      </div>

      <div className="min-w-0 flex-1">
        {/* El título es el enlace; su ::after cubre toda la fila. */}
        <Link
          href={editHref}
          className="line-clamp-2 font-medium leading-snug text-ink after:absolute after:inset-0 after:rounded-[1.375rem] after:content-[''] md:line-clamp-1"
        >
          {p.title}
        </Link>
        <p className="mt-0.5 truncate text-xs text-sage-600">
          {OPERATION_LABELS[p.operation]} · {TYPE_LABELS[p.type]} · {formatArea(p.area)} ·{" "}
          {p.zone}
        </p>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <span className="font-display text-[0.95rem] leading-none text-moss-700 md:hidden">
            {formatPrice(p)}
          </span>
          {p.draft && <span className="glass-chip glass-chip--draft">Borrador</span>}
          {status !== "disponible" && (
            <span
              className={`glass-chip ${status === "vendida" ? "glass-chip--dark" : "glass-chip--warn"}`}
            >
              {saleStatusLabel(p)}
            </span>
          )}
          {p.featured && !p.draft && <span className="glass-chip">★ Portada</span>}
          {status === "disponible" && priceDrop(p) && (
            <span className="glass-chip glass-chip--warn">Bajó de precio</span>
          )}
          {status === "disponible" && !priceDrop(p) && isNew(p) && (
            <span className="glass-chip">Nuevo</span>
          )}
          {!p.coords && (
            <span className="glass-chip glass-chip--warn" title="No aparece en el mapa de la web">
              Sin ubicación
            </span>
          )}
        </div>
      </div>

      <span
        className={`hidden shrink-0 font-display text-lg md:block ${
          status === "vendida" ? "text-ink-soft/45 line-through decoration-1" : "text-moss-700"
        }`}
      >
        {formatPrice(p)}
      </span>

      <div className="flex shrink-0 items-center">
        {!p.draft && (
          <Link
            href={`/propiedades/${p.slug}`}
            target="_blank"
            aria-label={`Ver «${p.title}» en la web`}
            title="Ver en la web"
            className="relative z-10 flex h-9 w-9 items-center justify-center rounded-full text-ink-soft/50 transition-colors hover:bg-white/80 hover:text-moss-700"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14 21 3" />
            </svg>
          </Link>
        )}
        <span
          aria-hidden
          className="mx-1 hidden rounded-full bg-white/0 px-3.5 py-1.5 text-sm font-medium text-moss-700 transition-colors group-hover:bg-white/80 sm:inline-flex"
        >
          Editar
        </span>
        <SocialKitButton
          variant="icon"
          slug={p.slug}
          title={p.title}
          images={propertyImages(p)}
          draft={Boolean(p.draft)}
        />
        <DuplicateButton slug={p.slug} title={p.title} />
        <DeleteButton
          action={deletePropertyAction}
          slug={p.slug}
          name={p.title}
          kind="propiedad"
        />
      </div>
    </li>
  );
}
