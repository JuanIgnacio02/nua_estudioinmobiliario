"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";

export default function PropertyGallery({
  images,
  alt,
  operationLabel,
  featured,
}: {
  images: string[];
  alt: string;
  operationLabel: string;
  featured?: boolean;
}) {
  const [current, setCurrent] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const total = images.length;

  const go = useCallback(
    (dir: number) => setCurrent((c) => (c + dir + total) % total),
    [total]
  );

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(false);
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [lightbox, go]);

  return (
    <>
      {/* Main viewer */}
      <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl bg-bone-dark md:aspect-[16/8]">
        <Image
          src={images[current]}
          alt={alt}
          fill
          priority
          quality={90}
          sizes="(max-width: 1600px) 100vw, 1600px"
          className="cursor-zoom-in object-cover"
          onClick={() => setLightbox(true)}
        />
        <div className="pointer-events-none absolute left-5 top-5 flex gap-2">
          <span className="rounded-full bg-moss-900/70 px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.2em] text-mint-50 backdrop-blur-sm">
            {operationLabel}
          </span>
          {featured && (
            <span className="rounded-full bg-mint-50/90 px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.2em] text-moss-700">
              Destacado
            </span>
          )}
        </div>

        {/* Counter + open gallery */}
        <button
          onClick={() => setLightbox(true)}
          className="absolute bottom-5 right-5 flex items-center gap-2 rounded-full bg-moss-900/70 px-4 py-2 text-xs font-medium text-mint-50 backdrop-blur-sm transition-colors hover:bg-moss-900/90"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M3 15l5-5 4 4 3-3 6 6" />
          </svg>
          {current + 1} / {total}
        </button>

        {total > 1 && (
          <>
            <NavBtn side="left" onClick={() => go(-1)} />
            <NavBtn side="right" onClick={() => go(1)} />
          </>
        )}
      </div>

      {/* Thumbnails */}
      {total > 1 && (
        <div className="mt-3 flex gap-3 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <button
              key={img + i}
              onClick={() => setCurrent(i)}
              className={`relative aspect-[4/3] h-20 shrink-0 overflow-hidden rounded-lg transition-all md:h-24 ${
                i === current
                  ? "ring-2 ring-moss-600"
                  : "opacity-60 hover:opacity-100"
              }`}
            >
              <Image src={img} alt={`${alt} — foto ${i + 1}`} fill sizes="120px" className="object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[100] flex flex-col bg-moss-900/97 backdrop-blur"
          onClick={() => setLightbox(false)}
        >
          <div className="flex items-center justify-between px-5 py-4 text-mint-50 md:px-10">
            <span className="text-sm">
              {current + 1} / {total}
            </span>
            <button
              onClick={() => setLightbox(false)}
              className="rounded-full border border-mint-100/30 px-4 py-1.5 text-sm transition-colors hover:bg-mint-100/10"
            >
              Cerrar ✕
            </button>
          </div>
          <div
            className="relative flex-1"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={images[current]}
              alt={alt}
              fill
              quality={95}
              sizes="100vw"
              className="object-contain p-4 md:p-10"
            />
            {total > 1 && (
              <>
                <NavBtn side="left" onClick={() => go(-1)} light />
                <NavBtn side="right" onClick={() => go(1)} light />
              </>
            )}
          </div>
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
      aria-label={side === "left" ? "Anterior" : "Siguiente"}
      className={`absolute top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full backdrop-blur-sm transition-colors ${
        side === "left" ? "left-4" : "right-4"
      } ${
        light
          ? "bg-mint-100/10 text-mint-50 hover:bg-mint-100/20"
          : "bg-moss-900/60 text-mint-50 hover:bg-moss-900/90"
      }`}
    >
      {side === "left" ? "←" : "→"}
    </button>
  );
}
