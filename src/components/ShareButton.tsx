"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Compartir una propiedad. En el celular abre el menú nativo (WhatsApp,
 * Instagram, etc.); en la compu, un menú con WhatsApp y "Copiar link".
 */
export default function ShareButton({ title, path }: { title: string; path: string }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const url = () => new URL(path, window.location.origin).toString();

  const onClick = async () => {
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    if (coarse && navigator.share) {
      try {
        await navigator.share({ title, text: `${title} — NÚA Estudio Inmobiliario`, url: url() });
      } catch {
        /* la persona canceló */
      }
      return;
    }
    setOpen((o) => !o);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url());
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
        setOpen(false);
      }, 1400);
    } catch {
      window.prompt("Copiá el link:", url());
    }
  };

  return (
    <div ref={box} className="relative">
      <button
        type="button"
        onClick={onClick}
        aria-expanded={open}
        aria-haspopup="menu"
        className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-moss-600/20 px-3 py-2.5 text-sm font-medium text-moss-700 transition-colors hover:bg-mint-100 sm:w-auto sm:px-5"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="shrink-0" aria-hidden>
          <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13" />
        </svg>
        Compartir
      </button>
      {open && (
        <div
          role="menu"
          className="absolute left-0 top-full z-40 mt-2 w-60 overflow-hidden rounded-2xl border border-moss-600/10 bg-bone p-1.5 shadow-[0_20px_50px_-20px_rgba(36,41,15,0.45)]"
        >
          <a
            role="menuitem"
            href={`https://wa.me/?text=${encodeURIComponent(`${title}\n${typeof window !== "undefined" ? url() : ""}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-ink transition-colors hover:bg-mint-100"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#25D366" aria-hidden>
              <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm5.4 14.2c-.2.6-1.3 1.2-1.8 1.3-.5 0-1 .3-3.3-.7-2.8-1.2-4.6-4.1-4.7-4.3-.1-.2-1.1-1.5-1.1-2.9s.7-2.1 1-2.4c.3-.3.6-.3.8-.3h.6c.2 0 .4 0 .6.5l.9 2.1c.1.2.1.4 0 .6l-.3.5-.4.5c-.1.1-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.4 2.4 1.5.3.1.5.1.6-.1l.9-1.1c.2-.3.4-.2.7-.1l2 1c.3.1.5.2.5.3.1.2.1.7-.1 1.3Z" />
            </svg>
            Enviar por WhatsApp
          </a>
          <button
            role="menuitem"
            type="button"
            onClick={copy}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-ink transition-colors hover:bg-mint-100"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-moss-600" aria-hidden>
              {copied ? (
                <path d="m5 12 5 5 9-10" />
              ) : (
                <path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" />
              )}
            </svg>
            {copied ? "¡Link copiado!" : "Copiar link"}
          </button>
        </div>
      )}
    </div>
  );
}
