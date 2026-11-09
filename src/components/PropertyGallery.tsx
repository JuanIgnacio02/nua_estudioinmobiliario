"use client";

import { useCallback, useEffect, useRef, useState, ViewTransition } from "react";
import Image from "next/image";

/** Distancia mínima (px) para que un deslizamiento cuente como cambio de foto. */
const SWIPE_PX = 45;

/** Deslizar con el dedo para pasar fotos (visor de la ficha y ampliado). */
function useSwipe(onSwipe: (dir: 1 | -1) => void) {
  const start = useRef<{ x: number; y: number } | null>(null);
  return {
    onTouchStart: (e: React.TouchEvent) => {
      const t = e.touches[0];
      start.current = { x: t.clientX, y: t.clientY };
    },
    onTouchEnd: (e: React.TouchEvent) => {
      const s = start.current;
      start.current = null;
      if (!s) return;
      const t = e.changedTouches[0];
      const dx = t.clientX - s.x;
      // Solo gestos mayormente horizontales: no le roba el scroll vertical.
      if (Math.abs(dx) > SWIPE_PX && Math.abs(dx) > Math.abs(t.clientY - s.y)) {
        onSwipe(dx < 0 ? 1 : -1);
      }
    },
  };
}

export default function PropertyGallery({
  images,
  alt,
  operationLabel,
  statusLabel,
  featured,
  transitionName,
}: {
  images: string[];
  alt: string;
  operationLabel: string;
  /** "Reservada" / "Vendida" / "Alquilada"; sin valor si está disponible. */
  statusLabel?: string;
  featured?: boolean;
  /** Mismo nombre que la foto de la tarjeta: se anima de una a la otra. */
  transitionName?: string;
}) {
  const [current, setCurrent] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const total = images.length;
  const closeBtn = useRef<HTMLButtonElement>(null);
  const opener = useRef<HTMLButtonElement>(null);

  const go = useCallback(
    (dir: number) => setCurrent((c) => (c + dir + total) % total),
    [total]
  );
  const swipeMain = useSwipe(go);
  const swipeBox = useSwipe(go);

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(false);
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    const returnTo = opener.current;
    document.body.style.overflow = "hidden";
    // Lenis ignora overflow:hidden; SmoothScroll lo pausa con este evento.
    window.dispatchEvent(new CustomEvent("nua:scroll-lock", { detail: true }));
    window.addEventListener("keydown", onKey);
    closeBtn.current?.focus();
    return () => {
      document.body.style.overflow = "";
      window.dispatchEvent(new CustomEvent("nua:scroll-lock", { detail: false }));
      window.removeEventListener("keydown", onKey);
      returnTo?.focus();
    };
  }, [lightbox, go]);

  if (total === 0) return null;

  const prev = (current - 1 + total) % total;
  const next = (current + 1) % total;

  return (
    <>
      {/* Visor principal */}
      <ViewTransition name={transitionName}>
      <div
        className="relative aspect-[3/2] w-full overflow-hidden rounded-2xl bg-bone-dark"
        {...swipeMain}
      >
        <Image
          src={images[current]}
          alt={`${alt} — foto ${current + 1} de ${total}`}
          fill
          preload={current === 0}
          sizes="(max-width: 1600px) 100vw, 1600px"
          className="cursor-zoom-in object-cover"
          onClick={() => setLightbox(true)}
        />
        <div className="pointer-events-none absolute left-5 top-5 flex gap-2">
          <span className="rounded-full bg-moss-900/70 px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.2em] text-mint-50 backdrop-blur-sm">
            {operationLabel}
          </span>
          {statusLabel ? (
            <span className="rounded-full bg-ink/85 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-mint-50">
              {statusLabel}
            </span>
          ) : (
            featured && (
              <span className="rounded-full bg-mint-50/90 px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.2em] text-moss-700">
                Destacado
              </span>
            )
          )}
        </div>

        <button
          ref={opener}
          onClick={() => setLightbox(true)}
          className="absolute bottom-5 right-5 flex min-h-11 items-center gap-2 rounded-full bg-moss-900/70 px-4 py-2 text-xs font-medium text-mint-50 backdrop-blur-sm transition-colors hover:bg-moss-900/90"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M3 15l5-5 4 4 3-3 6 6" />
          </svg>
          {total > 1 ? `Ver las ${total} fotos` : "Ampliar"}
        </button>

        {total > 1 && (
          <>
            <NavBtn side="left" onClick={() => go(-1)} />
            <NavBtn side="right" onClick={() => go(1)} />
          </>
        )}
      </div>
      </ViewTransition>

      {/* Miniaturas */}
      {total > 1 && (
        <div className="mt-3 flex gap-3 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <button
              key={img + i}
              onClick={() => setCurrent(i)}
              aria-label={`Ver foto ${i + 1}`}
              aria-current={i === current}
              className={`relative aspect-[4/3] h-20 shrink-0 overflow-hidden rounded-lg transition-all md:h-24 ${
                i === current ? "ring-2 ring-moss-600" : "opacity-60 hover:opacity-100"
              }`}
            >
              <Image src={img} alt="" fill sizes="128px" className="object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* Visor ampliado */}
      {lightbox && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Fotos de ${alt}`}
          className="fixed inset-0 z-[100] flex flex-col bg-moss-900/98"
          onClick={() => setLightbox(false)}
        >
          <div className="flex items-center justify-between px-5 py-4 text-mint-50 md:px-10">
            <span className="text-sm tracking-wide" aria-live="polite">
              {current + 1} <span className="text-mint-100/40">/ {total}</span>
            </span>
            <button
              ref={closeBtn}
              onClick={() => setLightbox(false)}
              className="min-h-11 rounded-full border border-mint-100/25 px-4 py-1.5 text-sm transition-colors hover:bg-mint-100/10"
            >
              Cerrar ✕
            </button>
          </div>

          {/* La foto ocupa todo el espacio disponible: antes tenía un tope de
              860px y "ampliar" la mostraba más chica que en la ficha. */}
          <div
            className="relative flex-1 px-2 md:px-20"
            onClick={(e) => e.stopPropagation()}
            {...swipeBox}
          >
            <div className="relative h-full w-full">
              <Image
                src={images[current]}
                alt={`${alt} — foto ${current + 1} de ${total}`}
                fill
                quality={90}
                sizes="100vw"
                className="object-contain"
              />
            </div>
            {total > 1 && (
              <>
                <NavBtn side="left" onClick={() => go(-1)} light />
                <NavBtn side="right" onClick={() => go(1)} light />
                {/* Precarga la anterior y la siguiente con la misma URL que va
                    a pedir el visor: pasar de foto es instantáneo. */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute left-0 top-0 h-full w-full opacity-0"
                >
                  {[prev, next].map((i) => (
                    <Image
                      key={i}
                      src={images[i]}
                      alt=""
                      fill
                      loading="eager"
                      quality={90}
                      sizes="100vw"
                      className="object-contain"
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          {total > 1 && (
            // overflow afuera y `mx-auto w-max` adentro: centra cuando entran y
            // scrollea cuando no. Con justify-center + overflow, las primeras
            // miniaturas quedaban cortadas a la izquierda e inalcanzables.
            <div
              className="overflow-x-auto py-5"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mx-auto flex w-max gap-2 px-5">
              {images.map((img, i) => (
                <button
                  key={img + i}
                  onClick={() => setCurrent(i)}
                  aria-label={`Ver foto ${i + 1}`}
                  aria-current={i === current}
                  className={`relative aspect-[4/3] h-14 shrink-0 overflow-hidden rounded-md transition-all md:h-16 ${
                    i === current ? "ring-2 ring-mint-50" : "opacity-40 hover:opacity-80"
                  }`}
                >
                  <Image src={img} alt="" fill sizes="96px" className="object-cover" />
                </button>
              ))}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}

function NavBtn({
  side,
  onClick,
  light,
}: {
  side: "left" | "right";
  onClick: () => void;
  light?: boolean;
}) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      aria-label={side === "left" ? "Foto anterior" : "Foto siguiente"}
      className={`absolute top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full backdrop-blur-sm transition-colors ${
        side === "left" ? "left-3 md:left-5" : "right-3 md:right-5"
      } ${
        light
          ? "bg-mint-100/10 text-mint-50 hover:bg-mint-100/25"
          : "bg-moss-900/60 text-mint-50 hover:bg-moss-900/90"
      }`}
    >
      <span aria-hidden>{side === "left" ? "←" : "→"}</span>
    </button>
  );
}
