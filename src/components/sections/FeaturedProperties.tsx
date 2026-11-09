"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { type Property } from "@/lib/properties";
import PropertyCard from "@/components/PropertyCard";
import AnimatedHeading from "@/components/anim/AnimatedHeading";
import {
  gsap,
  useIsomorphicLayoutEffect,
  prefersReducedMotion,
} from "@/lib/gsap";

export default function FeaturedProperties({
  properties: featuredProperties,
}: {
  properties: Property[];
}) {
  const grid = useRef<HTMLDivElement>(null);
  // Avance del carrusel del celular (0 a 1), para la barrita de abajo.
  const [progress, setProgress] = useState(0);
  const onScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const max = el.scrollWidth - el.clientWidth;
    setProgress(max > 0 ? el.scrollLeft / max : 0);
  };

  useIsomorphicLayoutEffect(() => {
    const el = grid.current;
    if (!el || prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      gsap.from(el.querySelectorAll("[data-card]"), {
        y: 60,
        autoAlpha: 0,
        duration: 1,
        ease: "power3.out",
        stagger: 0.12,
        scrollTrigger: { trigger: el, start: "top 80%" },
      });
    }, el);
    return () => ctx.revert();
  }, []);

  return (
    <section id="propiedades" className="bg-bone py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-6 md:px-10">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="text-eyebrow mb-5 text-sage-500">Propiedades</p>
            <AnimatedHeading
              text="Selección destacada"
              className="text-display font-display text-ink"
            />
          </div>
          <Link
            href="/propiedades"
            data-cursor="Explorar"
            className="group inline-flex shrink-0 items-center gap-3 rounded-full border border-moss-600/20 px-6 py-3 text-sm text-moss-600 transition-colors hover:bg-moss-600 hover:text-mint-100"
          >
            Ver todas las propiedades
            <span className="transition-transform group-hover:translate-x-1">
              →
            </span>
          </Link>
        </div>

        {/* Celular: carrusel deslizable (antes eran 6 tarjetas apiladas, casi
            cinco pantallas de scroll). Tablet y compu: grilla. */}
        <div
          ref={grid}
          onScroll={onScroll}
          className="no-scrollbar -mx-6 mt-12 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-6 px-6 pb-2 sm:mx-0 sm:mt-16 sm:grid sm:snap-none sm:grid-cols-2 sm:gap-x-6 sm:gap-y-14 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-3"
        >
          {featuredProperties.map((p, i) => (
            <div data-card key={p.slug} className="w-[84%] shrink-0 snap-start sm:w-auto">
              <PropertyCard property={p} index={i} />
            </div>
          ))}
          <Link
            href="/propiedades"
            className="flex w-[60%] shrink-0 snap-start flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-moss-600/25 text-center text-moss-700 sm:hidden"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-moss-600 text-mint-100">→</span>
            <span className="font-display text-xl">Ver todas</span>
          </Link>
        </div>
        {featuredProperties.length > 1 && (
          <div className="mx-auto mt-6 h-[3px] w-24 overflow-hidden rounded-full bg-moss-600/12 sm:hidden" aria-hidden>
            <div
              className="h-full rounded-full bg-moss-600 transition-[width] duration-150"
              style={{ width: `${Math.max(18, progress * 100)}%` }}
            />
          </div>
        )}
      </div>
    </section>
  );
}
