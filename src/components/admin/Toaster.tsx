"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

type Kind = "success" | "error";
type Toast = { id: number; text: string; kind: Kind; href?: string; leaving?: boolean };

const EVENT = "nua:toast";

/** Muestra un aviso desde cualquier componente del admin. */
export function toast(text: string, kind: Kind = "success") {
  window.dispatchEvent(new CustomEvent(EVENT, { detail: { text, kind } }));
}

/** Mensajes que llegan por la URL después de guardar (?ok=…). */
const MESSAGES: Record<string, string> = {
  "propiedad-creada": "Propiedad creada",
  "propiedad-guardada": "Cambios guardados",
  "propiedad-borrada": "Propiedad borrada",
  "loteo-creado": "Loteo creado",
  "loteo-guardado": "Cambios guardados",
  "loteo-borrado": "Loteo borrado",
  guardado: "Cambios guardados · ya se ven en la web",
};

export default function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);
  const params = useSearchParams();
  const pathname = usePathname();

  const dismiss = useCallback((id: number) => {
    setToasts((ts) => ts.map((t) => (t.id === id ? { ...t, leaving: true } : t)));
    window.setTimeout(
      () => setToasts((ts) => ts.filter((t) => t.id !== id)),
      260
    );
  }, []);

  const push = useCallback(
    (t: Omit<Toast, "id">) => {
      const id = nextId.current++;
      setToasts((ts) => [...ts.slice(-2), { ...t, id }]);
      window.setTimeout(() => dismiss(id), t.kind === "error" ? 7000 : 4500);
    },
    [dismiss]
  );

  // Avisos disparados desde el código (subidas, errores…).
  useEffect(() => {
    const on = (e: Event) => {
      const { text, kind } = (e as CustomEvent<{ text: string; kind: Kind }>).detail;
      push({ text, kind });
    };
    window.addEventListener(EVENT, on);
    return () => window.removeEventListener(EVENT, on);
  }, [push]);

  // Avisos que vienen en la URL después de una acción del servidor.
  const ok = params.get("ok");
  const ver = params.get("ver");
  const handled = useRef<string | null>(null);
  useEffect(() => {
    if (!ok) {
      handled.current = null;
      return;
    }
    // En desarrollo React corre los efectos dos veces: un solo aviso.
    const key = `${ok}|${ver ?? ""}`;
    if (handled.current === key) return;
    handled.current = key;
    push({
      text: MESSAGES[ok] ?? "Cambios guardados",
      kind: "success",
      href: ver && ver.startsWith("/") ? ver : undefined,
    });
    // Se limpia la URL: si recargás, el aviso no vuelve a salir.
    const rest = new URLSearchParams(window.location.search);
    rest.delete("ok");
    rest.delete("ver");
    const qs = rest.toString();
    window.history.replaceState(null, "", pathname + (qs ? `?${qs}` : ""));
  }, [ok, ver, pathname, push]);

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-4 z-[90] flex flex-col items-center gap-2 px-4 lg:bottom-6 lg:left-auto lg:right-6 lg:items-end"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          role={t.kind === "error" ? "alert" : "status"}
          className={`admin-toast pointer-events-auto flex max-w-md items-center gap-3 rounded-2xl py-3 pl-4 pr-2 text-sm shadow-[0_18px_40px_-14px_rgba(36,41,15,0.55)] backdrop-blur-md ${
            t.kind === "error"
              ? "bg-[#5c1a14]/95 text-white"
              : "bg-moss-900/92 text-mint-50"
          } ${t.leaving ? "is-leaving" : ""}`}
        >
          <span
            aria-hidden
            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
              t.kind === "error" ? "bg-white/15" : "bg-celadon-400 text-moss-900"
            }`}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              {t.kind === "error" ? <path d="M12 7v6M12 17h.01" /> : <path d="m5 12 5 5 9-10" />}
            </svg>
          </span>
          <span className="leading-snug">{t.text}</span>
          {t.href && (
            <Link
              href={t.href}
              target="_blank"
              className="shrink-0 rounded-full px-2.5 py-1 font-medium text-celadon-300 underline-offset-2 hover:underline"
            >
              Ver en la web ↗
            </Link>
          )}
          <button
            type="button"
            onClick={() => dismiss(t.id)}
            aria-label="Cerrar aviso"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full opacity-60 transition-opacity hover:opacity-100"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}
