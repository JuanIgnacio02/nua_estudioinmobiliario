"use client";

import Link from "next/link";
import { useFavorites } from "@/lib/favorites";
import { formatPrice, type Property } from "@/lib/properties";
import PropertyCard from "@/components/PropertyCard";

export default function FavoritesList({
  properties,
  phoneHref,
}: {
  properties: Property[];
  phoneHref: string;
}) {
  const { favorites, clear } = useFavorites();
  // En el orden en que se guardaron (la última primero). Las que se dieron de
  // baja desde el admin desaparecen solas.
  const list = favorites
    .map((slug) => properties.find((p) => p.slug === slug))
    .filter((p): p is Property => Boolean(p));

  if (list.length === 0) {
    return (
      <div className="mt-16 flex flex-col items-start gap-5 rounded-3xl border border-dashed border-moss-600/20 px-8 py-14">
        <p className="font-display text-3xl text-ink">Todavía no guardaste ninguna</p>
        <p className="max-w-md text-ink-soft/70">
          Tocá el corazón de cualquier propiedad para guardarla acá y
          compararlas tranquilo.
        </p>
        <Link
          href="/propiedades"
          className="inline-flex min-h-11 items-center gap-3 rounded-full bg-moss-600 px-6 py-3 text-sm font-medium text-mint-100 transition-colors hover:bg-moss-700"
        >
          Ver propiedades →
        </Link>
      </div>
    );
  }

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const message = [
    `Hola NÚA, me interesan estas propiedades:`,
    ...list.map((p) => `• ${p.title} (${formatPrice(p)})\n${origin}/propiedades/${p.slug}`),
    "",
    "¿Me pasan más información?",
  ].join("\n");

  return (
    <>
      <div className="sticky top-20 z-20 mt-10 flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-moss-600/10 bg-bone/85 p-4 backdrop-blur-xl md:top-24 md:p-5">
        <p className="text-sm text-ink-soft/75">
          <span className="font-semibold text-ink">{list.length}</span>{" "}
          {list.length === 1 ? "propiedad guardada" : "propiedades guardadas"}
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={clear}
            className="min-h-11 rounded-full px-4 text-sm text-ink-soft/70 transition-colors hover:text-[#b0413e]"
          >
            Vaciar
          </button>
          <a
            href={`https://wa.me/${phoneHref}?text=${encodeURIComponent(message)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-moss-600 px-6 py-3 text-sm font-medium text-mint-100 transition-colors hover:bg-moss-700"
          >
            {list.length === 1 ? "Consultar por WhatsApp" : `Consultar por las ${list.length}`}
            <span aria-hidden>→</span>
          </a>
        </div>
      </div>

      <div className="mt-12 grid grid-cols-1 gap-x-6 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((p, i) => (
          <PropertyCard key={p.slug} property={p} index={i} eager={i < 3} />
        ))}
      </div>
    </>
  );
}
