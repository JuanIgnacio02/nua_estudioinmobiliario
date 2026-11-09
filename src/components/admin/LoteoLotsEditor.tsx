"use client";

import { useState } from "react";
import {
  LOT_STATUS_COLORS,
  LOT_STATUS_LABELS,
  polygonAreaM2,
  type Lot,
  type LotStatus,
} from "@/lib/loteos";
import { formatArea } from "@/lib/properties";
import { rectBehind, rectBeside, rectCorners, type LatLng, type Rect } from "@/lib/geo";
import TerrainEditor from "./TerrainEditor";
import { useConfirm } from "./ui";

const STATUSES: LotStatus[] = ["disponible", "reservado", "vendido"];

export default function LoteoLotsEditor({
  center,
  lots,
  onChange,
}: {
  center: [number, number];
  lots: Lot[];
  onChange: (lots: Lot[]) => void;
}) {
  const [selected, setSelected] = useState<number | null>(lots.length ? 0 : null);
  const [dialog, confirm] = useConfirm();

  const patch = (i: number, changes: Partial<Lot>) =>
    onChange(lots.map((l, idx) => (idx === i ? { ...l, ...changes } : l)));

  const nextNumber = () =>
    String(lots.reduce((max, l) => Math.max(max, Number(l.number) || 0), 0) + 1);

  const addLot = (boundary: LatLng[] = [], from?: Lot) => {
    const next: Lot = {
      number: nextNumber(),
      boundary,
      area: boundary.length >= 3 ? polygonAreaM2(boundary) : 0,
      price: from?.price,
      status: "disponible",
    };
    onChange([...lots, next]);
    setSelected(lots.length);
  };

  const removeLot = async (i: number) => {
    const lot = lots[i];
    if (lot.boundary.length >= 3) {
      const ok = await confirm({
        title: `¿Borrar el lote ${lot.number}?`,
        body: "Se pierde el dibujo del lote. Podés volver atrás saliendo sin guardar.",
        confirmLabel: "Borrar lote",
      });
      if (!ok) return;
    }
    onChange(lots.filter((_, idx) => idx !== i));
    setSelected((s) => (s === i ? (lots.length > 1 ? 0 : null) : s != null && s > i ? s - 1 : s));
  };

  const setBoundary = (b: LatLng[]) => {
    if (selected == null) return;
    patch(selected, { boundary: b, area: b.length >= 3 ? polygonAreaM2(b) : 0 });
  };

  const current = selected != null ? lots[selected] : null;

  // Vecinos: los otros lotes, tenues y clickeables para pasar a editarlos.
  const others = lots.map((lot, i) => ({
    points: i === selected ? [] : lot.boundary,
    label: lot.number,
    stroke: LOT_STATUS_COLORS[lot.status].stroke,
    fill: LOT_STATUS_COLORS[lot.status].fill,
    onClick: () => setSelected(i),
  }));

  // Lote pegado al actual (mismo tamaño y giro): cargar una manzana entera es
  // dibujar el primero y tocar "al lado" las veces que haga falta.
  const neighborButtons = (rect: Rect | null) =>
    rect && current ? (
      <div className="flex items-center gap-1 rounded-full bg-mint-100/80 p-1">
        <span className="px-2 text-[11px] font-medium text-moss-700">Nuevo lote:</span>
        {(
          [
            ["←", "a la izquierda", () => rectBeside(rect, -1)],
            ["→", "a la derecha", () => rectBeside(rect, 1)],
            ["↑", "atrás", () => rectBehind(rect, 1)],
          ] as const
        ).map(([icon, label, make]) => (
          <button
            key={label}
            type="button"
            onClick={() => addLot(rectCorners(make()), current)}
            title={`Agregar un lote igual ${label}`}
            aria-label={`Agregar un lote igual ${label}`}
            className="flex h-7 min-w-7 items-center justify-center rounded-full bg-white px-2 text-xs font-semibold text-moss-700 shadow-sm transition-colors hover:bg-moss-600 hover:text-mint-50"
          >
            {icon}
          </button>
        ))}
      </div>
    ) : null;

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_17rem]">
      {/* Editor del lote elegido */}
      <div className="order-2 min-w-0 lg:order-1">
        {current && selected != null ? (
          <TerrainEditor
            pin={center}
            value={current.boundary}
            onChange={setBoundary}
            others={others}
            editKey={selected}
            title={
              <span className="rounded-full bg-moss-600 px-3 py-1 text-xs font-semibold text-mint-50">
                Lote {current.number}
              </span>
            }
            extra={neighborButtons}
          />
        ) : (
          <div className="flex h-[300px] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-moss-600/20 bg-white/30 px-6 text-center">
            <p className="text-sm text-ink-soft/70">
              Agregá el primer lote: escribís su frente y fondo y aparece sobre el
              satélite. Después, los de al lado se agregan con un toque.
            </p>
            <button type="button" onClick={() => addLot()} className="glass-btn-primary">
              + Agregar el primer lote
            </button>
          </div>
        )}
      </div>

      {/* Lista de lotes */}
      <div className="order-1 lg:order-2">
        <div className="flex items-center justify-between">
          <span className="admin-label">Lotes ({lots.length})</span>
          <button
            type="button"
            onClick={() => addLot()}
            className="glass-btn px-3 py-1.5 text-xs"
          >
            + Agregar
          </button>
        </div>

        <div className="mt-3 max-h-[560px] space-y-2 overflow-y-auto pr-1">
          {lots.map((lot, i) => {
            const isSel = i === selected;
            const drawn = lot.boundary.length >= 3;
            return (
              <div
                key={i}
                onClick={() => setSelected(i)}
                className={`cursor-pointer rounded-xl border p-2.5 transition-colors ${
                  isSel
                    ? "border-moss-600/60 bg-white/85 shadow-sm"
                    : "border-moss-600/12 bg-white/45 hover:bg-white/70"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    aria-hidden
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ background: LOT_STATUS_COLORS[lot.status].fill }}
                  />
                  <input
                    value={lot.number}
                    onChange={(e) => patch(i, { number: e.target.value })}
                    onClick={(e) => e.stopPropagation()}
                    className="admin-input w-14 px-2 py-1 text-center text-sm font-semibold"
                    aria-label="Número de lote"
                  />
                  <span className={`text-xs ${drawn ? "text-moss-600" : "text-[#9a6a12]"}`}>
                    {drawn ? formatArea(lot.area) : "sin dibujar"}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      void removeLot(i);
                    }}
                    aria-label={`Borrar lote ${lot.number}`}
                    title="Borrar lote"
                    className="ml-auto flex h-7 w-7 items-center justify-center rounded-full text-ink-soft/40 transition-colors hover:bg-red-500/10 hover:text-red-600"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
                    </svg>
                  </button>
                </div>
                {isSel && (
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      inputMode="numeric"
                      value={lot.price ?? ""}
                      onChange={(e) =>
                        patch(i, { price: e.target.value ? Number(e.target.value) : undefined })
                      }
                      onClick={(e) => e.stopPropagation()}
                      className="admin-input px-2.5 py-1.5 text-sm"
                      placeholder="US$"
                      aria-label="Precio en dólares"
                    />
                    <select
                      value={lot.status}
                      onChange={(e) => patch(i, { status: e.target.value as LotStatus })}
                      onClick={(e) => e.stopPropagation()}
                      className="admin-input px-2.5 py-1.5 text-sm"
                      aria-label="Estado"
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {LOT_STATUS_LABELS[s]}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      {dialog}
    </div>
  );
}
