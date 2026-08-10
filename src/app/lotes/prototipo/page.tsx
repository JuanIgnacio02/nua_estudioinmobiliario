import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LotBoundaryMapEmbed from "@/components/LotBoundaryMapEmbed";
import { findProperty, formatArea, formatPrice } from "@/lib/properties";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Prototipo · Visor de lote (Nivel 2)",
  robots: { index: false, follow: false },
};

// Terreno real usado para el prototipo.
const DEMO_SLUG = "terreno-25-de-mayo";

export default async function LotePrototipo() {
  const { properties, settings } = await getStore();
  const p = findProperty(properties, DEMO_SLUG);
  if (!p) notFound();

  const wa = `https://wa.me/${settings.contact.phoneHref}?text=${encodeURIComponent(
    `Hola! Me interesa el lote "${p.title}". ¿Me pasan más info?`
  )}`;

  return (
    <>
      <Navbar />
      <main className="bg-bone">
        <section className="mx-auto max-w-[1200px] px-5 py-14 md:px-10 md:py-20">
          <p className="text-eyebrow mb-4 flex items-center gap-3 text-sage-500">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-sage-500" />
            Prototipo · Nivel 2 — Visor del lote
          </p>
          <h1 className="font-display text-3xl text-ink md:text-5xl">
            {p.title}
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-ink-soft/70">
            La vista satelital funciona como foto aérea; encima se dibuja el
            contorno del terreno.{" "}
            {p.boundary && p.boundary.length >= 3
              ? "Este lote tiene su contorno real cargado desde el admin — la forma exacta del terreno sobre la imagen satelital."
              : `Como este lote todavía no tiene contorno cargado, se muestra un rectángulo aproximado calculado a partir de sus ${formatArea(
                  p.area
                )} — el fallback que permite lanzar la sección sin esperar a dibujar cada lote a mano.`}
          </p>

          <div className="mt-8 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
            {/* Visor satelital */}
            <div className="h-[420px] overflow-hidden rounded-3xl border border-mint-200 shadow-sm md:h-[560px]">
              <LotBoundaryMapEmbed property={p} boundary={p.boundary} />
            </div>

            {/* Ficha lateral */}
            <aside className="flex flex-col gap-5 rounded-3xl border border-mint-200 bg-white/60 p-6 md:p-8">
              <div>
                <p className="text-xs uppercase tracking-wide text-ink-soft/60">
                  {p.location}
                </p>
                <p className="mt-2 font-display text-4xl text-ink">
                  {formatPrice(p)}
                </p>
                {p.area > 0 && (
                  <p className="text-sm text-sage-500">
                    US$ {Math.round(p.price / p.area).toLocaleString("es-AR")} /
                    m²
                  </p>
                )}
              </div>

              <dl className="grid grid-cols-2 gap-3 border-y border-mint-200 py-4 text-sm">
                <div>
                  <dt className="text-ink-soft/60">Superficie</dt>
                  <dd className="font-semibold text-ink">{formatArea(p.area)}</dd>
                </div>
                <div>
                  <dt className="text-ink-soft/60">Zona</dt>
                  <dd className="font-semibold text-ink">{p.zone}</dd>
                </div>
                <div className="col-span-2">
                  <dt className="mb-1 text-ink-soft/60">Servicios</dt>
                  <dd className="flex flex-wrap gap-1.5">
                    {p.services.map((s) => (
                      <span
                        key={s}
                        className="rounded-full bg-mint-100 px-2.5 py-1 text-xs text-moss-600"
                      >
                        {s}
                      </span>
                    ))}
                  </dd>
                </div>
              </dl>

              <p className="text-sm leading-relaxed text-ink-soft/80">
                {p.description}
              </p>

              <a
                href={wa}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-auto inline-flex items-center justify-center rounded-full bg-sage-500 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-moss-600"
              >
                Consultar por WhatsApp
              </a>
              <Link
                href={`/propiedades/${p.slug}`}
                className="text-center text-xs text-sage-500 hover:underline"
              >
                Ver ficha completa →
              </Link>
            </aside>
          </div>

          <p className="mt-6 rounded-2xl bg-mint-50 px-5 py-4 text-xs text-ink-soft/70">
            <strong className="text-moss-600">Nota de prototipo:</strong> cuando
            el cliente dibuje el contorno real en el admin, el mismo visor
            reemplaza el rectángulo aproximado por la forma exacta del lote sin
            cambiar nada más. Probá el toggle Satélite / Mapa arriba a la
            derecha.
          </p>
        </section>
      </main>
      <Footer />
    </>
  );
}
