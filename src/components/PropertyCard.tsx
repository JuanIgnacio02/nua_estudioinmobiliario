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
} from "@/lib/properties";
import { gsap, prefersReducedMotion } from "@/lib/gsap";

export default function PropertyCard({
  property,
  index,
  priority = false,
}: {
  property: Property;
  index?: number;
  priority?: boolean;
}) {
  const imgRef = useRef<HTMLDivElement>(null);

  const onEnter = () => {
    if (prefersReducedMotion()) return;
    gsap.to(imgRef.current, { scale: 1.05, duration: 0.9, ease: "power3.out" });
  };
  const onLeave = () => {
    if (prefersReducedMotion()) return;
    gsap.to(imgRef.current, { scale: 1, duration: 0.9, ease: "power3.out" });
  };

  return (
    <Link
      href={`/propiedades/${property.slug}`}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      className="group flex flex-col"
    >
      {/* Media */}
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-bone-dark">
        <div ref={imgRef} className="absolute inset-0 will-change-transform">
          <Image
            src={property.image}
            alt={property.title}
            fill
            priority={priority}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover"
          />
        </div>

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
          <p className="font-display text-2xl text-moss-600">
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
                {property.bedrooms} hab.
              </span>
            )}
            {property.bathrooms != null && (
              <span className="before:mr-3 before:text-sage-400 before:content-['·']">
                {property.bathrooms} baños
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
