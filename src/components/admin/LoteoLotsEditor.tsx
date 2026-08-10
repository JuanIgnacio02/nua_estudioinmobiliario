"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import {
  LOT_STATUS_LABELS,
  polygonAreaM2,
  type Lot,
  type LotStatus,
} from "@/lib/loteos";
import { formatArea } from "@/lib/properties";

const LoteoEditorMap = dynamic(() => import("./LoteoEditorMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-mint-100/40 text-sm text-sage-500">
      Cargando editor…
    </div>
  ),
});

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
  const [selected, setSelected] = useState<number | null>(
    lots.length ? 0 : null
  );

  const patch = (i: number, changes: Partial<Lot>) =>
    onChange(lots.map((l, idx) => (idx === i ? { ...l, ...changes } : l)));

  const addLot = () => {
    const nextNum = String(
      lots.reduce((max, l) => Math.max(max, Number(l.number) || 0), 0) + 1
    );
    const next: Lot = {
      number: nextNum,
      boundary: [],
      area: 0,
      status: "disponible",
    };
    onChange([...lots, next]);
    setSelected(lots.length);
  };

  const removeLot = (i: number) => {
    onChange(lots.filter((_, idx) => idx !== i));
    setSelected((s) => (s === i ? null : s != null && s > i ? s - 1 : s));
  };

  const setBoundary = (b: [number, number][]) => {
    if (selected == null) return;
    const area = b.length >= 3 ? polygonAreaM2(b) : 0;
    patch(selected, { boundary: b, area });
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
      {/* Mapa editor */}
      <div className="order-2 h-[440px] overflow-hidden rounded-xl border border-moss-600/15 lg:order-1">
        <LoteoEditorMap
          center={center}
          lots={lots}
          selected={selected}
          onSelect={setSelected}
          onChangeBoundary={setBoundary}
        />
      </div>

      {/* Lista de lotes */}
      <div className="order-1 lg:order-2">
        <div className="flex items-center justify-between">
          <span className="text-eyebrow text-sage-500">
            Lotes ({lots.length})
          </span>
          <button
            type="button"
            onClick={addLot}
            className="rounded-full bg-moss-600 px-4 py-1.5 text-xs font-medium text-mint-100 hover:bg-moss-700"
          >
            + Agregar lote
          </button>
        </div>

        <div className="mt-3 max-h-[400px] space-y-2 overflow-y-auto pr-1">
          {lots.length === 0 && (
            <p className="rounded-xl border border-dashed border-moss-600/20 bg-mint-50/40 px-4 py-6 text-center text-xs text-ink-soft/60">
              Agregá tu primer lote y dibujalo sobre el satélite.
            </p>
          )}
          {lots.map((lot, i) => {
            const isSel = i === selected;
            const drawn = lot.boundary.length >= 3;
            return (
              <div
                key={i}
                onClick={() => setSelected(i)}
                className={`cursor-pointer rounded-xl border p-3 transition-colors ${
                  isSel
                    ? "border-moss-600 bg-mint-50"
                    : "border-moss-600/15 bg-white/60 hover:bg-mint-50/50"
                }`}
              >
                <div className="flex items-center gap-2">
                  <input
                    value={lot.number}
                    onChange={(e) => patch(i, { number: e.target.value })}
                    onClick={(e) => e.stopPropagation()}
                    className="admin-input !w-16 !py-1.5 text-center text-sm font-semibold"
                    placeholder="N°"
                  />
                  <span
                    className={`text-xs ${
                      drawn ? "text-moss-600" : "text-red-500"
                    }`}
                  >
                    {drawn ? `✓ ${formatArea(lot.area)}` : "sin dibujar"}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeLot(i);
                    }}
                    className="ml-auto rounded-full px-2 py-1 text-xs text-ink-soft/50 hover:bg-red-500/10 hover:text-red-600"
                  >
                    Borrar
                  </button>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    value={lot.price ?? ""}
                    onChange={(e) =>
                      patch(i, {
                        price: e.target.value ? Number(e.target.value) : undefined,
                      })
                    }
                    onClick={(e) => e.stopPropagation()}
                    className="admin-input !py-1.5 text-sm"
                    placeholder="Precio US$"
                  />
                  <select
                    value={lot.status}
                    onChange={(e) =>
                      patch(i, { status: e.target.value as LotStatus })
                    }
                    onClick={(e) => e.stopPropagation()}
                    className="admin-input !py-1.5 text-sm"
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {LOT_STATUS_LABELS[s]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
