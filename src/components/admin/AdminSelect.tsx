"use client";

import { useEffect, useId, useRef, useState } from "react";
import { menuColumns } from "@/lib/menu";

export type SelectOption = { value: string; label: string };
export type SelectGroup = { label: string; options: SelectOption[] };

const COL_W = 196; // ancho de cada columna (px)
const MIN_COL = 160; // en pantallas chicas, columnas más angostas antes que una sola larga
const GAP = 8; // separación con el botón
const EDGE = 12; // margen con el borde de la pantalla

/**
 * Menú desplegable del admin. Reemplaza al <select> del sistema, que abría
 * la lista con la letra y el azul de Windows: este usa la tipografía de la
 * web y, con muchas opciones, las acomoda en columnas en vez de una lista
 * larga.
 *
 * - Con `name` va dentro de un formulario (input oculto) y avisa el cambio
 *   con un evento "input", así el admin detecta "Cambios sin guardar".
 * - Se abre en la capa superior (popover): no lo corta ningún contenedor.
 * - Teclado: flechas, Inicio/Fin, Enter, Esc y saltar por la primera letra.
 */
export default function AdminSelect({
  name,
  value,
  defaultValue,
  onChange,
  options,
  groups,
  emptyValue,
  placeholder,
  className = "",
  disabled = false,
  ariaLabel,
}: {
  name?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  options?: SelectOption[];
  groups?: SelectGroup[];
  /** Con este valor elegido, el botón muestra `placeholder` (ej. "Tipo"). */
  emptyValue?: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  ariaLabel?: string;
}) {
  const popId = `menu-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const [inner, setInner] = useState(defaultValue ?? "");
  const current = value ?? inner;
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popRef = useRef<HTMLDivElement>(null);
  const colsRef = useRef<HTMLDivElement>(null);
  const hiddenRef = useRef<HTMLInputElement>(null);
  const notify = useRef(false);

  const flat = groups ? groups.flatMap((g) => g.options) : (options ?? []);
  const selected = flat.find((o) => o.value === current);
  const items = flat.length + (groups && groups.length > 1 ? groups.length : 0);
  const showPlaceholder = placeholder != null && current === emptyValue;

  // El formulario se entera del cambio (el input oculto no dispara eventos solo).
  useEffect(() => {
    if (!notify.current) return;
    notify.current = false;
    hiddenRef.current?.dispatchEvent(new Event("input", { bubbles: true }));
  }, [current]);

  /** Ubica el menú debajo del botón (o arriba si no entra) y elige columnas. */
  const place = () => {
    const t = triggerRef.current;
    const p = popRef.current;
    if (!t || !p) return;
    const r = t.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const cols = Math.max(1, Math.min(menuColumns(items), Math.floor((vw - 2 * EDGE) / MIN_COL)));
    const width = Math.min(Math.max(r.width, cols * COL_W), vw - 2 * EDGE);
    if (colsRef.current) colsRef.current.style.columnCount = String(cols);
    p.style.width = `${width}px`;
    p.style.left = `${Math.min(Math.max(EDGE, r.left), vw - EDGE - width)}px`;
    p.style.maxHeight = "none";
    const natural = p.scrollHeight;
    const below = vh - r.bottom - GAP - EDGE;
    const above = r.top - GAP - EDGE;
    const up = natural > below && above > below;
    p.style.maxHeight = `${Math.max(140, up ? above : below)}px`;
    if (up) {
      p.style.top = "auto";
      p.style.bottom = `${vh - r.top + GAP}px`;
    } else {
      p.style.bottom = "auto";
      p.style.top = `${r.bottom + GAP}px`;
    }
  };

  const optionEls = () =>
    Array.from(popRef.current?.querySelectorAll<HTMLButtonElement>('[role="option"]') ?? []);

  const openMenu = () => {
    const p = popRef.current;
    if (!p || disabled) return;
    if (!p.matches(":popover-open")) p.showPopover();
    place();
    setOpen(true);
    const els = optionEls();
    const target = els.find((el) => el.dataset.value === current) ?? els[0];
    target?.focus({ preventScroll: true });
    target?.scrollIntoView({ block: "nearest" });
  };

  const close = (refocus = false) => {
    const p = popRef.current;
    if (p?.matches(":popover-open")) p.hidePopover();
    setOpen(false);
    if (refocus) triggerRef.current?.focus();
  };

  // Abierto: se cierra tocando afuera y acompaña el scroll de la página.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      const n = e.target as Node;
      if (triggerRef.current?.contains(n) || popRef.current?.contains(n)) return;
      close();
    };
    const onMove = () => place();
    document.addEventListener("pointerdown", onDown);
    window.addEventListener("scroll", onMove, true);
    window.addEventListener("resize", onMove);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      window.removeEventListener("scroll", onMove, true);
      window.removeEventListener("resize", onMove);
    };
    // place/close solo leen refs: no hace falta re-suscribir.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const choose = (v: string) => {
    if (value === undefined) setInner(v);
    if (v !== current) {
      notify.current = true;
      onChange?.(v);
    }
    close(true);
  };

  const onListKey = (e: React.KeyboardEvent) => {
    const els = optionEls();
    const i = els.indexOf(document.activeElement as HTMLButtonElement);
    const go = (n: number) => {
      e.preventDefault();
      const el = els[Math.max(0, Math.min(els.length - 1, n))];
      el?.focus({ preventScroll: true });
      el?.scrollIntoView({ block: "nearest" });
    };
    if (e.key === "ArrowDown") go(i + 1);
    else if (e.key === "ArrowUp") go(i - 1);
    else if (e.key === "Home") go(0);
    else if (e.key === "End") go(els.length - 1);
    else if (e.key === "Escape") {
      e.preventDefault();
      close(true);
    } else if (e.key === "Tab") close(true);
    else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      // Primera letra: salta a la próxima opción que empieza así.
      const k = norm(e.key);
      const order = [...els.slice(i + 1), ...els.slice(0, i + 1)];
      const hit = order.find((el) => norm(el.textContent ?? "").startsWith(k));
      if (hit) go(els.indexOf(hit));
    }
  };

  const renderOption = (o: SelectOption) => {
    const sel = o.value === current;
    return (
      <button
        key={o.value}
        type="button"
        role="option"
        aria-selected={sel}
        tabIndex={-1}
        data-value={o.value}
        onClick={() => choose(o.value)}
        className={`flex w-full break-inside-avoid items-center gap-2 rounded-xl px-3 py-2 text-left text-sm outline-none transition-colors ${
          sel
            ? "bg-mint-100 font-medium text-moss-700"
            : "text-ink hover:bg-white focus-visible:bg-white"
        }`}
      >
        <span className="min-w-0 flex-1">{o.label}</span>
        {sel && (
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" className="shrink-0" aria-hidden>
            <path d="M20 6 9 17l-5-5" />
          </svg>
        )}
      </button>
    );
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={popId}
        aria-label={ariaLabel ? `${ariaLabel}: ${selected?.label ?? ""}` : undefined}
        onClick={() => (open ? close() : openMenu())}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            e.preventDefault();
            openMenu();
          } else if (e.key === "Escape" && open) {
            e.preventDefault();
            close();
          }
        }}
        className={`admin-input flex cursor-pointer items-center gap-2 text-left ${className}`}
      >
        <span className={`min-w-0 flex-1 truncate ${showPlaceholder ? "text-ink-soft/70" : ""}`}>
          {showPlaceholder ? placeholder : (selected?.label ?? placeholder ?? "")}
        </span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className={`shrink-0 text-moss-600 transition-transform duration-200 ${open ? "rotate-180" : ""}`} aria-hidden>
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {name && <input ref={hiddenRef} type="hidden" name={name} value={current} />}

      <div
        ref={popRef}
        id={popId}
        popover="manual"
        role="listbox"
        aria-label={ariaLabel}
        onKeyDown={onListKey}
        // Dentro de un <label>, un clic en el menú "tocaría" el botón y lo cerraría.
        onClick={(e) => e.preventDefault()}
        className="nua-pop m-0 overflow-y-auto rounded-[1.25rem] border border-moss-600/10 bg-bone p-1.5 font-sans text-ink shadow-[0_28px_60px_-28px_rgba(36,41,15,0.5)] [inset:auto]"
      >
        <div ref={colsRef} className="gap-1">
          {groups
            ? groups.map((g) => (
                <div key={g.label} role="group" aria-label={g.label} className="break-inside-avoid">
                  {groups.length > 1 && (
                    <p className="px-3 pb-1 pt-2.5 text-[10px] uppercase tracking-[0.2em] text-sage-500" aria-hidden>
                      {g.label}
                    </p>
                  )}
                  {g.options.map(renderOption)}
                </div>
              ))
            : flat.map(renderOption)}
        </div>
      </div>
    </>
  );
}

function norm(s: string) {
  return s
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}
