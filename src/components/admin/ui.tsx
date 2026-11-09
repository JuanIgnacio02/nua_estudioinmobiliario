"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { useFormStatus } from "react-dom";

/* Piezas compartidas del admin: botones con estado, campos, paneles,
   interruptor, textarea que crece y diálogo de confirmación. */

export function Spinner({ className = "" }: { className?: string }) {
  return <span aria-hidden className={`admin-spinner ${className}`} />;
}

/** Botón de envío que muestra "Guardando…" mientras corre la acción. */
export function SubmitButton({
  children,
  pendingLabel = "Guardando…",
  className = "glass-btn-primary",
  disabled,
}: {
  children: React.ReactNode;
  pendingLabel?: string;
  className?: string;
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending || disabled}
      aria-busy={pending}
      className={className}
    >
      {pending && <Spinner />}
      {pending ? pendingLabel : children}
    </button>
  );
}

/** Rótulo + control. `hint` va debajo, en gris. */
export function Field({
  label,
  hint,
  children,
  className = "",
}: {
  label: string;
  hint?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="admin-label">{label}</span>
      <div className="mt-2">{children}</div>
      {hint && (
        <span className="mt-1.5 block text-xs leading-relaxed text-ink-soft/60">
          {hint}
        </span>
      )}
    </label>
  );
}

/** Tarjeta de sección con título y bajada. */
export function Panel({
  title,
  description,
  aside,
  children,
  className = "",
}: {
  title?: string;
  description?: React.ReactNode;
  aside?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`glass-panel p-5 md:p-6 ${className}`}>
      {(title || aside) && (
        <header className="mb-5 flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
          <div>
            {title && (
              <h2 className="font-sans text-[0.95rem] font-semibold leading-snug tracking-normal text-ink">
                {title}
              </h2>
            )}
            {description && (
              <p className="mt-1 text-sm leading-relaxed text-ink-soft/65">
                {description}
              </p>
            )}
          </div>
          {aside}
        </header>
      )}
      {children}
    </section>
  );
}

/** Interruptor on/off accesible. */
export function Switch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className="admin-switch"
    />
  );
}

/** Control segmentado (Publicada / Borrador, etc.). */
export function Segmented<T extends string | boolean>({
  value,
  options,
  onChange,
  label,
  full = false,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  label: string;
  /** Ocupa todo el ancho, con botones parejos. */
  full?: boolean;
}) {
  return (
    <div className={`glass-segment ${full ? "flex w-full" : ""}`} role="group" aria-label={label}>
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          onClick={() => onChange(o.value)}
          aria-pressed={value === o.value}
          className={`glass-segment__btn ${full ? "flex-1 px-2" : ""} ${
            value === o.value ? "is-active" : ""
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** Textarea que crece con el texto: se lee entero sin scroll interno. */
export function AutoTextarea({
  minRows = 3,
  className = "",
  onInput,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { minRows?: number }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const fit = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight + 2}px`;
  }, []);
  // Ajusta al montar y cuando cambia el valor controlado.
  useLayoutEffect(fit, [fit, props.value]);
  useEffect(() => {
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, [fit]);
  return (
    <textarea
      ref={ref}
      rows={minRows}
      onInput={(e) => {
        fit();
        onInput?.(e);
      }}
      className={`admin-input resize-none overflow-hidden ${className}`}
      {...props}
    />
  );
}

/* --------------------------- Confirmación --------------------------- */

type ConfirmOptions = {
  title: string;
  body?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "danger" | "default";
  /** Ícono: tacho (borrar) o advertencia. */
  icon?: "trash" | "alert";
};

/**
 * Diálogo de confirmación con <dialog> nativo (atrapa el foco, cierra con
 * Esc). Uso: const [dialog, confirm] = useConfirm();
 *            if (await confirm({ title: "¿Borrar?" })) …
 */
export function useConfirm() {
  const [opts, setOpts] = useState<ConfirmOptions | null>(null);
  const resolver = useRef<((ok: boolean) => void) | null>(null);

  const confirm = useCallback((o: ConfirmOptions) => {
    setOpts(o);
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  const settle = (ok: boolean) => {
    resolver.current?.(ok);
    resolver.current = null;
    setOpts(null);
  };

  const dialog = (
    <ConfirmDialog
      open={!!opts}
      options={opts}
      onConfirm={() => settle(true)}
      onCancel={() => settle(false)}
    />
  );
  return [dialog, confirm] as const;
}

function ConfirmDialog({
  open,
  options,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  options: ConfirmOptions | null;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  // Se guarda el último contenido para que no se vacíe mientras se cierra.
  const [shown, setShown] = useState<ConfirmOptions | null>(options);
  if (options && options !== shown) setShown(options);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  const danger = (shown?.tone ?? "danger") === "danger";

  return (
    <dialog
      ref={ref}
      className="admin-dialog"
      onCancel={(e) => {
        e.preventDefault();
        onCancel();
      }}
      onClick={(e) => {
        // Clic en el fondo oscuro = cancelar.
        if (e.target === ref.current) onCancel();
      }}
      aria-labelledby="admin-dialog-title"
    >
      {shown && (
        <div>
          <div
            className={`flex h-11 w-11 items-center justify-center rounded-full ${
              danger ? "bg-red-500/10 text-red-700" : "bg-mint-100 text-moss-700"
            }`}
            aria-hidden
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              {(shown.icon ?? (danger ? "trash" : "alert")) === "trash" ? (
                <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6" />
              ) : (
                <path d="M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
              )}
            </svg>
          </div>
          <h2
            id="admin-dialog-title"
            className="mt-4 font-sans text-lg font-semibold leading-snug tracking-normal text-ink"
          >
            {shown.title}
          </h2>
          {shown.body && (
            <div className="mt-2 text-sm leading-relaxed text-ink-soft/75">
              {shown.body}
            </div>
          )}
          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            {/* En lo destructivo el foco arranca en "Cancelar": un Enter
                apurado no borra nada. */}
            <button
              type="button"
              onClick={onCancel}
              autoFocus={danger}
              className="glass-btn justify-center"
            >
              {shown.cancelLabel ?? "Cancelar"}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              autoFocus={!danger}
              className={danger ? "glass-btn-danger" : "glass-btn-primary justify-center"}
            >
              {shown.confirmLabel ?? "Confirmar"}
            </button>
          </div>
        </div>
      )}
    </dialog>
  );
}
