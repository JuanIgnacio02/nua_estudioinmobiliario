"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import AnimatedHeading from "@/components/anim/AnimatedHeading";
import {
  formatPrice,
  formatArea,
  TYPE_LABELS,
  type Property,
} from "@/lib/properties";

const PropertiesMap = dynamic(() => import("./PropertiesMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-mint-100/40 text-sm text-sage-500">
      Cargando mapa…
    </div>
  ),
});

export default function MapExplorer({
  properties,
}: {
  properties: Property[];
}) {
  const [active, setActive] = useState<string | null>(null);
  const itemRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const list = useMemo(
    () => properties.filter((p) => p.operation === "venta" && p.coords),
    [properties]
  );

  // Keep the active list item in view when selected from the map.
  useEffect(() => {
    if (!active) return;
    itemRefs.current[active]?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
    });
  }, [active]);

  return (
    <section className="bg-bone py-20 md:py-28">
      <div className="mx-auto max-w-[1600px] px-5 md:px-10">
        <div className="mb-10 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="text-eyebrow mb-5 flex items-center gap-3 text-sage-500">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-sage-500" />
              Mapa de propiedades
            </p>
            <AnimatedHeading
              text="Explorá dónde estamos vendiendo"
              className="font-display text-4xl text-ink md:text-6xl"
            />
          </div>
          <p className="max-w-sm text-sm text-ink-soft/70 md:text-right">
            Pasá por la lista o tocá un marcador: el mapa vuela hasta la
            propiedad. {list.length} propiedades en venta en San Rafael y la
            región.
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-[380px_1fr]">
          {/* List */}
          <div className="order-2 flex max-h-[70vh] min-h-[460px] flex-col gap-2 overflow-y-auto pr-1 lg:order-1">
            {list.map((p) => {
              const isActive = active === p.slug;
              return (
                <button
                  key={p.slug}
                  ref={(el) => {
                    itemRefs.current[p.slug] = el;
                  }}
                  onMouseEnter={() => setActive(p.slug)}
                  onFocus={() => setActive(p.slug)}
                  onClick={() => setActive(p.slug)}
                  className={`group flex gap-4 rounded-2xl border p-3 text-left transition-all duration-300 ${
                    isActive
                      ? "border-moss-600/30 bg-mint-100 shadow-[0_10px_30px_-18px_rgba(36,41,15,0.6)]"
                      : "border-transparent bg-bone-dark/40 hover:bg-mint-100/60"
                  }`}
                >
                  <div className="relative h-20 w-24 shrink-0 overflow-hidden rounded-xl bg-bone-dark">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={p.image}
                      alt={p.title}
                      className={`h-full w-full object-cover transition-transform duration-500 ${
                        isActive ? "scale-105" : "group-hover:scale-105"
                      }`}
                    />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="text-[10px] uppercase tracking-[0.18em] text-sage-500">
                      {TYPE_LABELS[p.type]} · {p.city}
                    </span>
                    <span className="mt-1 line-clamp-2 font-display text-[15px] leading-tight text-ink">
                      {p.title}
                    </span>
                    <span className="mt-auto flex items-center justify-between pt-1.5">
                      <span className="font-display text-lg text-moss-600">
                        {formatPrice(p)}
                      </span>
                      <span className="text-[11px] text-ink-soft/60">
                        {formatArea(p.area)}
                      </span>
                    </span>
                  </div>
                </button>
              );
            })}
            <Link
              href="/propiedades"
              className="mt-1 rounded-2xl border border-dashed border-moss-600/25 px-4 py-3 text-center text-sm text-moss-600 transition-colors hover:bg-mint-100/50"
            >
              Ver todas las propiedades →
            </Link>
          </div>

          {/* Map */}
          <div className="order-1 h-[70vh] min-h-[460px] w-full overflow-hidden rounded-[1.75rem] border border-moss-600/10 shadow-[0_30px_60px_-30px_rgba(36,41,15,0.35)] lg:order-2">
            <PropertiesMap
              properties={list}
              activeSlug={active}
              onSelect={setActive}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
