"use client";

import { useState } from "react";

/** Oliva con croma suficiente para leerse como dato (el verde de marca da gris). */
const BAR = "#6b7f2a";

const fmtDay = (d: string) =>
  new Date(`${d}T12:00:00Z`).toLocaleDateString("es-AR", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });

/**
 * Visitas por día (una sola serie: el título la nombra, sin leyenda).
 * Cada barra es su propio blanco de hover/foco con el detalle del día.
 */
export default function VisitsChart({
  data,
}: {
  data: { day: string; view: number; whatsapp: number }[];
}) {
  const [active, setActive] = useState<number | null>(null);
  const max = Math.max(1, ...data.map((d) => d.view));
  const hovered = active != null ? data[active] : null;

  return (
    <figure className="relative">
      <div className="relative h-36" onPointerLeave={() => setActive(null)}>
        {/* Guía de referencia: el máximo del período */}
        <div className="pointer-events-none absolute inset-x-0 top-0 border-t border-dashed border-moss-900/10" />
        <span className="pointer-events-none absolute -top-2 right-0 bg-transparent text-[10px] text-ink-soft/45">
          {max}
        </span>

        <div className="flex h-full items-end gap-[2px]">
          {data.map((d, i) => {
            const h = d.view === 0 ? 0 : Math.max(3, (d.view / max) * 100);
            return (
              <button
                key={d.day}
                type="button"
                onPointerEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
                onBlur={() => setActive(null)}
                aria-label={`${fmtDay(d.day)}: ${d.view} visitas, ${d.whatsapp} consultas por WhatsApp`}
                className="group relative flex h-full flex-1 items-end focus:outline-none"
              >
                <span
                  className="block w-full rounded-t-[4px] transition-opacity"
                  style={{
                    height: `${h}%`,
                    background: BAR,
                    opacity: active == null || active === i ? 1 : 0.45,
                  }}
                />
                {d.view === 0 && (
                  <span className="absolute inset-x-0 bottom-0 h-px bg-moss-900/15" />
                )}
              </button>
            );
          })}
        </div>

        {hovered && active != null && (
          <div
            className="pointer-events-none absolute -top-16 z-10 w-max -translate-x-1/2 rounded-xl bg-moss-900/95 px-3 py-2 text-xs text-mint-50 shadow-lg"
            style={{ left: `${((active + 0.5) / data.length) * 100}%` }}
          >
            <p className="text-[10px] uppercase tracking-wider text-mint-100/60">
              {fmtDay(hovered.day)}
            </p>
            <p className="mt-0.5">
              <strong className="text-sm">{hovered.view}</strong>{" "}
              <span className="text-mint-100/70">visitas</span>
              <span className="mx-1.5 text-mint-100/40">·</span>
              <strong className="text-sm">{hovered.whatsapp}</strong>{" "}
              <span className="text-mint-100/70">WhatsApp</span>
            </p>
          </div>
        )}
      </div>
      <figcaption className="mt-2 flex justify-between text-[10px] text-ink-soft/50">
        <span>{fmtDay(data[0].day)}</span>
        <span>Hoy</span>
      </figcaption>

      {/* La misma información en tabla, para lectores de pantalla. */}
      <table className="sr-only">
        <caption>Visitas y consultas por día</caption>
        <thead>
          <tr>
            <th>Día</th>
            <th>Visitas</th>
            <th>WhatsApp</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.day}>
              <td>{fmtDay(d.day)}</td>
              <td>{d.view}</td>
              <td>{d.whatsapp}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
