"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  angleTowardStreet,
  areaM2,
  centroid,
  fromXY,
  normAngle,
  rectCorners,
  rectFromCorners,
  toXY,
  type LatLng,
  type Rect,
} from "@/lib/geo";
import { nearestStreetAction } from "@/app/admin/actions";
import type { OtherShape } from "./TerrainEditorMap";
import { Segmented, Spinner } from "./ui";
import { toast } from "./Toaster";

const TerrainEditorMap = dynamic(() => import("./TerrainEditorMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-mint-100/40 text-sm text-sage-500">
      Cargando mapa…
    </div>
  ),
});

type Mode = "rect" | "free";

const round1 = (n: number) => Math.round(n * 10) / 10;
const fmtNum = (n: number) => String(round1(n)).replace(".", ",");
const parseNum = (s: string) => {
  const n = parseFloat(s.replace(",", "."));
  return Number.isFinite(n) && n > 0 ? n : null;
};
const fmtArea = (m2: number) => `${Math.round(m2).toLocaleString("es-AR")} m²`;

/** Rectángulo que envuelve una forma libre (al pasar de libre a rectangular). */
function boundingRect(pts: LatLng[]): Rect {
  const c = centroid(pts);
  // Orientado según el lado más largo.
  let best = 0;
  let angle = 0;
  pts.forEach((p, i) => {
    const [x, y] = toXY(pts[(i + 1) % pts.length], p);
    const l = Math.hypot(x, y);
    if (l > best) {
      best = l;
      angle = (Math.atan2(y, x) * 180) / Math.PI;
    }
  });
  const a = (-angle * Math.PI) / 180;
  const local = pts.map((p) => {
    const [x, y] = toXY(p, c);
    return [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)];
  });
  const xs = local.map((p) => p[0]);
  const ys = local.map((p) => p[1]);
  const mx = (Math.max(...xs) + Math.min(...xs)) / 2;
  const my = (Math.max(...ys) + Math.min(...ys)) / 2;
  const back = (angle * Math.PI) / 180;
  const center = fromXY(
    [mx * Math.cos(back) - my * Math.sin(back), mx * Math.sin(back) + my * Math.cos(back)],
    c
  );
  return {
    center,
    width: Math.max(...xs) - Math.min(...xs),
    depth: Math.max(...ys) - Math.min(...ys),
    angle: normAngle(angle),
  };
}

function initial(value: LatLng[]) {
  const r = rectFromCorners(value);
  if (value.length === 0) {
    return { mode: "rect" as Mode, rect: null, w: "", d: "", closed: false };
  }
  if (r) {
    return { mode: "rect" as Mode, rect: r, w: fmtNum(r.width), d: fmtNum(r.depth), closed: true };
  }
  return { mode: "free" as Mode, rect: null, w: "", d: "", closed: value.length >= 3 };
}

/**
 * Editor del terreno sobre el mapa.
 *  - Rectangular: frente × fondo (como figura en la escritura). Aparece sobre
 *    el pin alineado con la calle; se mueve y se gira con las manijas.
 *  - Forma libre: se marcan las esquinas; los "+" agregan esquinas.
 */
export default function TerrainEditor({
  pin,
  value,
  onChange,
  declaredArea,
  others,
  editKey,
  title,
  extra,
}: {
  pin: LatLng;
  value: LatLng[];
  onChange: (pts: LatLng[]) => void;
  /** m² cargados en la ficha, para comparar y sugerir el fondo. */
  declaredArea?: number;
  /** Otros polígonos de referencia (lotes vecinos del loteo). */
  others?: OtherShape[];
  /** Al cambiar, el editor arranca de nuevo con `value` (otro lote). */
  editKey?: string | number;
  title?: React.ReactNode;
  /** Acciones extra según el rectángulo actual (p. ej. "lote al lado"). */
  extra?: (rect: Rect | null) => React.ReactNode;
}) {
  const [init] = useState(() => initial(value));
  const [mode, setMode] = useState<Mode>(init.mode);
  const [rect, setRectState] = useState<Rect | null>(init.rect);
  const [w, setW] = useState(init.w);
  const [d, setD] = useState(init.d);
  const [closed, setClosed] = useState(init.closed);
  const [selected, setSelected] = useState<number | null>(null);
  const [history, setHistory] = useState<LatLng[][]>([]);
  const [view, setView] = useState<"sat" | "mapa">("sat");
  const [fullscreen, setFullscreen] = useState(false);
  const [fitKey, setFitKey] = useState(0);
  const [aligning, setAligning] = useState(false);

  // Otro lote elegido: se reinicia todo desde su contorno.
  const [prevKey, setPrevKey] = useState(editKey);
  if (editKey !== prevKey) {
    const s = initial(value);
    setPrevKey(editKey);
    setMode(s.mode);
    setRectState(s.rect);
    setW(s.w);
    setD(s.d);
    setClosed(s.closed);
    setSelected(null);
    setHistory([]);
    setFitKey((k) => k + 1);
  }

  // Últimos valores para los gestos rápidos (arrastrar dispara muchos eventos).
  const live = useRef({ value, rect, onChange });
  useEffect(() => {
    live.current = { value, rect, onChange };
  });

  const begin = useCallback(() => {
    const snapshot = live.current.value;
    setHistory((h) => [...h.slice(-49), snapshot]);
  }, []);

  const setRect = useCallback((r: Rect) => {
    live.current.rect = r;
    setRectState(r);
    live.current.onChange(rectCorners(r));
  }, []);

  /* ----------------------------- calle ----------------------------- */

  const alignToStreet = useCallback(
    async (center: LatLng, { quiet = false, place = false } = {}) => {
      setAligning(true);
      try {
        const street = await nearestStreetAction(center[0], center[1]);
        const r = live.current.rect;
        if (street && r) {
          const angle = angleTowardStreet(r.center, street);
          let c = r.center;
          // Al aparecer: el pin suele estar sobre la vereda o la calle. Se
          // corre el terreno hacia adentro para que el frente quede sobre la
          // línea de edificación (~8 m del eje de la calle).
          if (place && street.distance < 30) {
            // Hacia adentro del lote = opuesto al frente: (-sen θ, cos θ).
            const a = (angle * Math.PI) / 180;
            const dist = 8 + r.depth / 2;
            c = fromXY([-Math.sin(a) * dist, Math.cos(a) * dist], street.point);
          }
          setRect({ ...r, center: c, angle });
          if (place) setFitKey((k) => k + 1);
        } else if (!quiet) {
          toast("No encontramos la calle cerca del pin. Giralo con la barra.", "error");
        }
      } catch {
        if (!quiet) toast("No se pudo consultar el mapa de calles. Giralo a mano.", "error");
      } finally {
        setAligning(false);
      }
    },
    [setRect]
  );

  /* --------------------------- rectangular --------------------------- */

  const onDims = (nw: string, nd: string) => {
    setW(nw);
    setD(nd);
    const width = parseNum(nw);
    const depth = parseNum(nd);
    if (!width || !depth) return;
    const r = live.current.rect;
    if (r) {
      setRect({ ...r, width, depth });
    } else {
      // Primera vez: aparece sobre el pin y se alinea con la calle.
      setRect({ center: pin, width, depth, angle: 0 });
      setClosed(true);
      setFitKey((k) => k + 1);
      void alignToStreet(pin, { quiet: true, place: true });
    }
  };

  const suggestedDepth =
    declaredArea && declaredArea > 0 && parseNum(w) && !parseNum(d)
      ? round1(declaredArea / (parseNum(w) as number))
      : null;

  /* ------------------------------ libre ------------------------------ */

  const points = value;
  const polygonDone = points.length >= 3 && (mode === "rect" || closed);

  const onMapClick = (p: LatLng) => {
    if (mode === "rect") {
      const r = live.current.rect;
      if (r) {
        begin();
        setRect({ ...r, center: p });
      } else if (parseNum(w) && parseNum(d)) {
        onDims(w, d);
      }
      return;
    }
    if (!closed) {
      begin();
      onChange([...points, p]);
    } else {
      setSelected(null);
    }
  };

  const removeSelected = useCallback(() => {
    if (selected == null) return;
    begin();
    const next = live.current.value.filter((_, i) => i !== selected);
    live.current.onChange(next);
    setSelected(null);
    if (next.length < 3) setClosed(false);
  }, [selected, begin]);

  const undo = () => {
    const prev = history[history.length - 1];
    if (!prev) return;
    setHistory((h) => h.slice(0, -1));
    onChange(prev);
    setSelected(null);
    if (mode === "rect") {
      const r = rectFromCorners(prev);
      if (r) {
        live.current.rect = r;
        setRectState(r);
        setW(fmtNum(r.width));
        setD(fmtNum(r.depth));
      } else if (prev.length === 0) {
        live.current.rect = null;
        setRectState(null);
      } else {
        setMode("free");
        setClosed(prev.length >= 3);
      }
    } else {
      setClosed((c) => c && prev.length >= 3);
    }
  };

  const clearAll = () => {
    if (!points.length) return;
    begin();
    onChange([]);
    live.current.rect = null;
    setRectState(null);
    setClosed(false);
    setSelected(null);
    setW("");
    setD("");
  };

  const switchMode = (m: Mode) => {
    if (m === mode) return;
    setSelected(null);
    if (m === "free") {
      setMode("free");
      setClosed(points.length >= 3);
      return;
    }
    // A rectangular: si ya es un rectángulo se respeta; si no, se envuelve.
    setMode("rect");
    if (points.length >= 3) {
      const r = rectFromCorners(points) ?? boundingRect(points);
      begin();
      setRect(r);
      setW(fmtNum(r.width));
      setD(fmtNum(r.depth));
    }
  };

  /* --------------------------- teclado/pantalla --------------------------- */

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if ((e.key === "Delete" || e.key === "Backspace") && selected != null) {
        e.preventDefault();
        removeSelected();
      }
      if (e.key === "Escape" && fullscreen) setFullscreen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected, fullscreen, removeSelected]);

  useEffect(() => {
    if (!fullscreen) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [fullscreen]);

  /* ------------------------------ métricas ------------------------------ */

  const drawn = polygonDone ? areaM2(points) : 0;
  const diff = drawn && declaredArea ? drawn / declaredArea - 1 : null;

  const help =
    mode === "rect"
      ? rect
        ? "Arrastrá el terreno (o la manija del centro) para ubicarlo, y la manija oscura para girarlo. También podés tocar el mapa donde va."
        : "Escribí el frente y el fondo (figuran en la escritura o en el plano): el terreno aparece sobre el pin, alineado con la calle."
      : !closed
        ? points.length >= 3
          ? "Seguí tocando esquinas o tocá la esquina 1 para cerrar el terreno."
          : "Tocá las esquinas del terreno en orden, una por una."
        : selected != null
          ? `Esquina ${selected + 1} elegida: arrastrala o quitala.`
          : "Arrastrá las esquinas para corregir. Los + agregan una esquina en ese lado.";

  const blockEnter = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      (e.target as HTMLInputElement).blur();
    }
  };

  return (
    <div
      className={
        fullscreen
          ? "fixed inset-0 z-[120] flex flex-col gap-3 bg-[#f1f2ea] p-3 md:p-5"
          : "overflow-hidden rounded-2xl border border-moss-600/12 bg-white/45"
      }
    >
      {/* Barra superior: modo + pantalla completa */}
      <div className={`flex flex-wrap items-center justify-between gap-2 ${fullscreen ? "" : "px-3 pt-3"}`}>
        <div className="flex flex-wrap items-center gap-3">
          {title}
          <Segmented
            label="Forma del terreno"
            value={mode}
            onChange={switchMode}
            options={[
              { value: "rect", label: "Rectangular" },
              { value: "free", label: "Forma libre" },
            ]}
          />
        </div>
        <button
          type="button"
          onClick={() => setFullscreen((f) => !f)}
          className="glass-btn px-3 py-1.5 text-xs"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            {fullscreen ? (
              <path d="M9 3v6H3M15 3v6h6M9 21v-6H3M15 21v-6h6" />
            ) : (
              <path d="M3 9V3h6M21 9V3h-6M3 15v6h6M21 15v6h-6" />
            )}
          </svg>
          {fullscreen ? "Salir" : "Pantalla completa"}
        </button>
      </div>

      {/* Controles del modo */}
      <div className={fullscreen ? "" : "px-3"}>
        {mode === "rect" ? (
          <div className="flex flex-wrap items-end gap-x-4 gap-y-3">
            <div className="flex items-end gap-2">
              <label className="block">
                <span className="admin-label">Frente</span>
                <span className="relative mt-1.5 block">
                  <input
                    value={w}
                    onChange={(e) => onDims(e.target.value, d)}
                    onFocus={begin}
                    onKeyDown={blockEnter}
                    inputMode="decimal"
                    placeholder="12"
                    className="admin-input w-24 py-2 pr-8"
                    aria-label="Frente en metros"
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-ink-soft/50">m</span>
                </span>
              </label>
              <span className="pb-2.5 text-ink-soft/50">×</span>
              <label className="block">
                <span className="admin-label">Fondo</span>
                <span className="relative mt-1.5 block">
                  <input
                    value={d}
                    onChange={(e) => onDims(w, e.target.value)}
                    onFocus={begin}
                    onKeyDown={blockEnter}
                    inputMode="decimal"
                    placeholder="25"
                    className="admin-input w-24 py-2 pr-8"
                    aria-label="Fondo en metros"
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-ink-soft/50">m</span>
                </span>
              </label>
            </div>

            {suggestedDepth && (
              <button
                type="button"
                onClick={() => onDims(w, fmtNum(suggestedDepth))}
                className="mb-1 rounded-full bg-mint-100 px-3 py-1.5 text-xs font-medium text-moss-700 transition-colors hover:bg-mint-200"
              >
                Usar fondo {fmtNum(suggestedDepth)} m (da los {declaredArea} m²)
              </button>
            )}

            {rect && (
              <div className="flex min-w-[15rem] flex-1 items-end gap-2">
                <label className="block flex-1">
                  <span className="admin-label">Giro · {Math.round(rect.angle)}°</span>
                  <input
                    type="range"
                    min={0}
                    max={359}
                    step={1}
                    value={Math.round(rect.angle)}
                    onPointerDown={begin}
                    onChange={(e) => setRect({ ...rect, angle: Number(e.target.value) })}
                    className="mt-3 w-full accent-[#455021]"
                    aria-label="Giro del terreno en grados"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => {
                    begin();
                    setRect({ ...rect, angle: normAngle(rect.angle + 90) });
                  }}
                  className="glass-btn mb-0.5 px-3 py-1.5 text-xs"
                  title="Girar 90°"
                >
                  90°
                </button>
                <button
                  type="button"
                  onClick={() => {
                    begin();
                    void alignToStreet(rect.center);
                  }}
                  disabled={aligning}
                  className="glass-btn mb-0.5 px-3 py-1.5 text-xs"
                  title="Poner el frente paralelo a la calle más cercana"
                >
                  {aligning ? <Spinner /> : null}
                  Alinear con la calle
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            {!closed && points.length >= 3 && (
              <button
                type="button"
                onClick={() => setClosed(true)}
                className="glass-btn-primary px-4 py-1.5 text-xs"
              >
                Terminar terreno
              </button>
            )}
            {selected != null && (
              <button
                type="button"
                onClick={removeSelected}
                className="rounded-full bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-700 transition-colors hover:bg-red-500/20"
              >
                Quitar esquina {selected + 1}
              </button>
            )}
            <span className="text-xs text-ink-soft/60">
              {points.length} esquina{points.length === 1 ? "" : "s"}
            </span>
          </div>
        )}
      </div>

      {/* Mapa */}
      <div
        className={`relative ${
          fullscreen ? "min-h-0 flex-1 overflow-hidden rounded-2xl" : "mt-3 h-[420px] md:h-[460px]"
        }`}
      >
        <TerrainEditorMap
          pin={pin}
          view={view}
          mode={mode}
          points={points}
          rect={mode === "rect" ? rect : null}
          closed={closed}
          selected={selected}
          others={others}
          fitKey={fitKey}
          resizeToken={fullscreen}
          onMapClick={onMapClick}
          onGestureStart={begin}
          onVertexMove={(i, p) => onChange(live.current.value.map((q, j) => (j === i ? p : q)))}
          onVertexClick={(i) => {
            if (!closed && i === 0 && points.length >= 3) setClosed(true);
            else setSelected((s) => (s === i ? null : i));
          }}
          onInsert={(i, p) => {
            begin();
            const next = [...live.current.value];
            next.splice(i + 1, 0, p);
            onChange(next);
            setSelected(i + 1);
          }}
          onRectMove={(center) => {
            const r = live.current.rect;
            if (r) setRect({ ...r, center });
          }}
          onRectNudge={([dlat, dlng]) => {
            const r = live.current.rect;
            if (r) setRect({ ...r, center: [r.center[0] + dlat, r.center[1] + dlng] });
          }}
          onRectRotate={(angle) => {
            const r = live.current.rect;
            if (r) setRect({ ...r, angle });
          }}
        />

        {/* Satélite / mapa */}
        <div className="absolute right-3 top-3 z-[1000] flex overflow-hidden rounded-full border border-white/60 bg-white/92 text-xs font-medium shadow-md backdrop-blur">
          {(["sat", "mapa"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              className={`px-3 py-1.5 transition-colors ${
                view === v ? "bg-moss-600 text-mint-100" : "text-ink-soft hover:bg-mint-100"
              }`}
            >
              {v === "sat" ? "Satélite" : "Calles"}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setFitKey((k) => k + 1)}
          className="absolute bottom-3 right-3 z-[1000] rounded-full border border-white/60 bg-white/92 px-3 py-1.5 text-xs font-medium text-moss-700 shadow-md backdrop-blur hover:bg-white"
        >
          Centrar
        </button>
      </div>

      {/* Pie: ayuda, superficie y deshacer */}
      <div
        className={`space-y-2.5 ${fullscreen ? "" : "border-t border-moss-600/10 px-3 py-3"}`}
      >
        <p className="text-xs leading-relaxed text-ink-soft/70">{help}</p>
        <div className="flex flex-wrap items-center gap-2">
          {drawn > 0 && (
            <span
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                diff == null || Math.abs(diff) <= 0.05
                  ? "bg-mint-100 text-moss-700"
                  : "bg-[#d9a441]/20 text-[#7a5310]"
              }`}
              title={declaredArea ? `Declarada: ${fmtArea(declaredArea)}` : undefined}
            >
              {fmtArea(drawn)}
              {diff != null &&
                (Math.abs(diff) <= 0.05
                  ? " ✓ coincide"
                  : ` · ${diff > 0 ? "+" : ""}${Math.round(diff * 100)}% vs. ${fmtArea(declaredArea as number)}`)}
            </span>
          )}
          {extra?.(mode === "rect" ? rect : null)}
          <span className="flex-1" />
          <button
            type="button"
            onClick={undo}
            disabled={!history.length}
            className="rounded-full px-3 py-1.5 text-xs font-medium text-ink-soft transition-colors hover:bg-white/80 disabled:opacity-35"
          >
            ↶ Deshacer
          </button>
          <button
            type="button"
            onClick={clearAll}
            disabled={!points.length}
            className="rounded-full px-3 py-1.5 text-xs font-medium text-ink-soft/70 transition-colors hover:bg-red-500/10 hover:text-red-700 disabled:opacity-35"
          >
            Borrar
          </button>
        </div>
      </div>
    </div>
  );
}
