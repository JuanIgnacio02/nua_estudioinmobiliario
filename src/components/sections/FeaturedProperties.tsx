"use client";

import Link from "next/link";
import { useRef } from "react";
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

        <div
          ref={grid}
          className="mt-16 grid grid-cols-1 gap-x-6 gap-y-14 sm:grid-cols-2 lg:grid-cols-3"
        >
          {featuredProperties.map((p, i) => (
            <div data-card key={p.slug}>
              <PropertyCard property={p} index={i} priority={i < 3} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
