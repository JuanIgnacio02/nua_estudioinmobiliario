"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Spinner, useConfirm } from "./ui";
import { toast } from "./Toaster";

type ActionResult = void | { ok: boolean; error?: string };

/** Serializa el formulario (sin archivos) para saber si algo cambió. */
function snapshotOf(form: HTMLFormElement | null) {
  if (!form) return "";
  const parts: string[] = [];
  new FormData(form).forEach((v, k) => {
    if (typeof v === "string") parts.push(`${k}=${v}`);
  });
  return parts.join("&");
}

/**
 * Formulario del admin con:
 *  - barra de guardado fija al pie (siempre a mano en formularios largos),
 *  - "Cambios sin guardar" + aviso antes de salir de la página,
 *  - Ctrl/⌘ + S para guardar,
 *  - estado "Guardando…" y aviso al terminar.
 * Las acciones que redirigen (crear/editar) llevan el aviso en la URL; las
 * que se quedan en la página (`stayOnPage`) devuelven { ok } y avisa acá.
 */
export default function AdminForm({
  action,
  children,
  submitLabel,
  cancelHref,
  stayOnPage = false,
  successMessage = "Cambios guardados · ya se ven en la web",
  onValues,
  className = "",
}: {
  action: (fd: FormData) => Promise<ActionResult>;
  children: React.ReactNode;
  submitLabel: string;
  cancelHref?: string;
  stayOnPage?: boolean;
  successMessage?: string;
  /** Recibe los valores cada vez que cambian (para vistas previas). */
  onValues?: (fd: FormData) => void;
  className?: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const baseline = useRef<string | null>(null);
  const lastSnap = useRef<string | null>(null);
  // Hasta que la persona toca algo, lo que cambie solo (mapas que se
  // inicializan, etc.) pasa a ser el punto de partida, no un "cambio".
  const touched = useRef(false);
  const busy = useRef(false);
  const [dirty, setDirty] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const [dialog, confirm] = useConfirm();

  const onValuesRef = useRef(onValues);
  useEffect(() => {
    onValuesRef.current = onValues;
  });

  const check = useCallback(() => {
    const form = formRef.current;
    if (!form) return;
    const now = snapshotOf(form);
    if (now !== lastSnap.current) {
      lastSnap.current = now;
      onValuesRef.current?.(new FormData(form));
    }
    if (baseline.current === null || !touched.current) {
      baseline.current = now;
      setDirty(false);
      return;
    }
    setDirty(now !== baseline.current);
  }, []);

  // Después de cada render: el estado de React (fotos, mapa, etiquetas) vive
  // en inputs ocultos, así que el snapshot lo refleja.
  useEffect(check);

  const markTouched = () => {
    touched.current = true;
  };

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (busy.current) return;
    const fd = new FormData(e.currentTarget);
    busy.current = true;
    startTransition(async () => {
      try {
        const res = await action(fd);
        if (res && res.ok === false) {
          toast(res.error ?? "No se pudo guardar. Probá de nuevo.", "error");
        } else if (stayOnPage) {
          touched.current = false;
          baseline.current = null;
          setDirty(false);
          toast(successMessage);
        }
      } catch (err) {
        // Las redirecciones de Next viajan como error: hay que dejarlas pasar.
        const digest =
          err && typeof err === "object" && "digest" in err ? String(err.digest) : "";
        if (digest.startsWith("NEXT_")) throw err;
        toast("No se pudo guardar. Revisá la conexión y probá de nuevo.", "error");
      } finally {
        busy.current = false;
      }
    });
  };

  // Ctrl/⌘ + S guarda.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        formRef.current?.requestSubmit();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Aviso antes de perder cambios: cerrar pestaña, recargar o ir a otro link.
  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (busy.current) return;
      e.preventDefault();
      e.returnValue = "";
    };
    const onClick = (e: MouseEvent) => {
      if (busy.current || e.defaultPrevented || e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a[href]");
      if (!(a instanceof HTMLAnchorElement)) return;
      if (a.target === "_blank" || a.hasAttribute("download")) return;
      const url = new URL(a.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;
      // Se frena antes de que lo vea el <Link> de Next.
      e.preventDefault();
      e.stopPropagation();
      void confirm({
        title: "¿Salir sin guardar?",
        body: "Hay cambios que todavía no guardaste. Si salís ahora, se pierden.",
        confirmLabel: "Salir sin guardar",
        cancelLabel: "Seguir editando",
        icon: "alert",
      }).then((leave) => {
        if (!leave) return;
        busy.current = true;
        router.push(url.pathname + url.search + url.hash);
      });
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    window.addEventListener("click", onClick, true);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      window.removeEventListener("click", onClick, true);
    };
  }, [dirty, confirm, router]);

  return (
    <form
      ref={formRef}
      onSubmit={submit}
      onPointerDown={markTouched}
      onKeyDown={markTouched}
      onDrop={markTouched}
      onInput={check}
      onChange={check}
      className={className}
    >
      {children}

      {/* Barra de guardado */}
      <div className="sticky bottom-3 z-30 mt-10 md:bottom-5">
        <div className="admin-savebar flex items-center gap-3 px-4 py-3 md:px-5">
          <p className="flex min-w-0 flex-1 items-center gap-2 text-sm" aria-live="polite">
            {pending ? (
              <>
                <Spinner className="text-sage-600" />
                <span className="text-ink-soft/80">Guardando…</span>
              </>
            ) : dirty ? (
              <>
                <span className="h-2 w-2 shrink-0 rounded-full bg-[#d9a441] shadow-[0_0_0_3px_rgba(217,164,65,0.22)]" />
                <span className="truncate font-medium text-ink">Cambios sin guardar</span>
              </>
            ) : (
              <>
                <span className="h-2 w-2 shrink-0 rounded-full bg-sage-400/70" />
                <span className="truncate text-ink-soft/60">Sin cambios</span>
              </>
            )}
            <kbd className="ml-2 hidden rounded-md border border-moss-600/15 bg-white/60 px-1.5 py-0.5 font-sans text-[10px] text-ink-soft/55 xl:inline">
              Ctrl + S
            </kbd>
          </p>
          {cancelHref && (
            <Link
              href={cancelHref}
              className="hidden rounded-full px-4 py-2 text-sm text-ink-soft/70 transition-colors hover:bg-white/70 hover:text-moss-700 sm:inline-flex"
            >
              Cancelar
            </Link>
          )}
          <button
            type="submit"
            disabled={pending}
            aria-busy={pending}
            className="glass-btn-primary shrink-0"
          >
            {pending && <Spinner />}
            {pending ? "Guardando…" : submitLabel}
          </button>
        </div>
      </div>
      {dialog}
    </form>
  );
}
