"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import {
  type Property,
  formatPrice,
  formatArea,
  TYPE_LABELS,
  OPERATION_LABELS,
  plural,
  saleStatus,
  saleStatusLabel,
} from "@/lib/properties";
import { gsap, prefersReducedMotion } from "@/lib/gsap";

export default function PropertyCard({
  property,
  index,
  eager = false,
  preview = false,
}: {
  property: Property;
  index?: number;
  /** Cargar sin esperar al scroll (solo tarjetas visibles al abrir). */
  eager?: boolean;
  /** Vista previa del admin: misma tarjeta, sin enlace. */
  preview?: boolean;
}) {
  const imgRef = useRef<HTMLDivElement>(null);
  const status = saleStatus(property);
  const sold = status === "vendida";

  const onEnter = () => {
    if (prefersReducedMotion()) return;
    gsap.to(imgRef.current, { scale: 1.05, duration: 0.9, ease: "power3.out" });
  };
  const onLeave = () => {
    if (prefersReducedMotion()) return;
    gsap.to(imgRef.current, { scale: 1, duration: 0.9, ease: "power3.out" });
  };

  const Wrapper = preview ? PreviewBox : Link;

  return (
    <Wrapper
      href={`/propiedades/${property.slug}`}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      className="group flex flex-col"
    >
      {/* Media */}
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-bone-dark">
        <div ref={imgRef} className="absolute inset-0 will-change-transform">
          {property.image ? (
            <Image
              src={property.image}
              alt={property.title}
              fill
              loading={eager ? "eager" : "lazy"}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className={`object-cover ${sold ? "grayscale-[60%]" : ""}`}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-mint-100 to-bone-dark text-sm text-sage-500">
              Sin fotos todavía
            </div>
          )}
        </div>

        {status !== "disponible" && (
          <span
            className={`absolute bottom-4 left-4 rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] shadow-sm ${
              sold ? "bg-ink/85 text-mint-50" : "bg-[#d9a441] text-moss-900"
            }`}
          >
            {saleStatusLabel(property)}
          </span>
        )}

        {/* Top meta row */}
        <div className="absolute inset-x-0 top-0 flex items-center justify-between p-4">
          <span className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.2em] text-mint-50 drop-shadow">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-mint-50" />
            {OPERATION_LABELS[property.operation]}
          </span>
          {property.featured && (
            <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-mint-50/90 drop-shadow">
              Destacado
            </span>
          )}
        </div>

        {/* Corner arrow — scales in on hover, no sliding text */}
        <div className="absolute bottom-4 right-4 flex h-11 w-11 scale-75 items-center justify-center rounded-full bg-mint-50 text-moss-700 opacity-0 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-100 group-hover:opacity-100">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M7 17 17 7M9 7h8v8" />
          </svg>
        </div>
      </div>

      {/* Caption — editorial */}
      <div className="flex flex-1 flex-col pt-5">
        <div className="flex items-baseline justify-between gap-4 border-b border-moss-600/15 pb-3">
          <span className="font-display text-sm text-sage-400">
            {index != null ? String(index + 1).padStart(2, "0") : "—"}
          </span>
          <span className="text-[10px] uppercase tracking-[0.22em] text-sage-500">
            {TYPE_LABELS[property.type]} · {property.city}
          </span>
        </div>

        <h3 className="mt-4 font-display text-2xl leading-[1.1] text-ink transition-colors duration-300 group-hover:text-moss-600">
          {property.title}
        </h3>

        <p className="mt-2 text-sm text-ink-soft/60">{property.location}</p>

        <div className="mt-5 flex items-end justify-between gap-4 pt-1">
          <p
            className={`font-display text-2xl ${
              sold ? "text-ink-soft/45 line-through decoration-1" : "text-moss-600"
            }`}
          >
            {formatPrice(property)}
          </p>
          <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-0.5 text-xs text-ink-soft/70">
            {property.coveredArea != null && (
              <span>{formatArea(property.coveredArea)} cub.</span>
            )}
            <span>
              {formatArea(property.area)}
              {property.coveredArea != null ? " terr." : ""}
            </span>
            {property.bedrooms != null && (
              <span className="before:mr-3 before:text-sage-400 before:content-['·']">
                {plural(property.bedrooms, "dorm.", "dorm.")}
              </span>
            )}
            {property.bathrooms != null && (
              <span className="before:mr-3 before:text-sage-400 before:content-['·']">
                {plural(property.bathrooms, "baño", "baños")}
              </span>
            )}
          </div>
        </div>
      </div>
    </Wrapper>
  );
}

/** Contenedor sin navegación para la vista previa del admin. */
function PreviewBox({
  href: _href,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { href: string }) {
  void _href;
  return <div {...props} />;
}
