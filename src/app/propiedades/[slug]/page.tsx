import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PropertyCard from "@/components/PropertyCard";
import PropertyMapEmbed from "@/components/PropertyMapEmbed";
import LotBoundaryMapEmbed from "@/components/LotBoundaryMapEmbed";
import PropertyInquiry from "@/components/PropertyInquiry";
import PropertyGallery from "@/components/PropertyGallery";
import {
  findProperty,
  getRelated,
  formatPrice,
  propertyImages,
  TYPE_LABELS,
  OPERATION_LABELS,
} from "@/lib/properties";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { properties } = await getStore();
  const p = findProperty(properties, slug);
  if (!p) return { title: "Propiedad no encontrada" };
  return {
    title: p.title,
    description: p.description,
    openGraph: { images: [p.image], title: p.title, description: p.description },
  };
}

export default async function PropertyDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { properties, settings } = await getStore();
  const p = findProperty(properties, slug);
  if (!p) notFound();

  const related = getRelated(properties, slug);
  const WHATSAPP = settings.contact.phoneHref;
  const EMAIL = settings.contact.email;
  const waText = encodeURIComponent(
    `Hola NÚA, me interesa la propiedad "${p.title}" (${formatPrice(p)}). ¿Podrían darme más información?`
  );

  // Christie's-style stat row: big number + small label. Keep it to 4 tiles so
  // the grid never leaves a lonely item on a second row — drop "Tipo" (already
  // shown in the eyebrow) once beds/baths/superficies fill the row.
  const stats: { value: string; label: string }[] = [
    ...(p.bedrooms != null
      ? [{ value: String(p.bedrooms), label: "Dormitorios" }]
      : []),
    ...(p.bathrooms != null
      ? [{ value: String(p.bathrooms), label: "Baños" }]
      : []),
    ...(p.coveredArea != null
      ? [{ value: p.coveredArea.toLocaleString("es-AR"), label: "m² cubiertos" }]
      : []),
    {
      value: p.area.toLocaleString("es-AR"),
      label: p.coveredArea != null ? "m² terreno" : "m² totales",
    },
  ];
  if (stats.length < 4) stats.push({ value: TYPE_LABELS[p.type], label: "Tipo" });

  const features = [...p.services, ...(p.amenities ?? [])];

  return (
    <>
      <Navbar />
      <main className="bg-bone">
        {/* Breadcrumb */}
        <div className="border-b border-moss-600/10 px-5 pt-28 md:px-10 md:pt-32">
          <nav className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-2 pb-4 text-xs text-ink-soft/60">
            <Link href="/" className="hover:text-moss-600">
              Inicio
            </Link>
            <span>/</span>
            <Link href="/propiedades" className="hover:text-moss-600">
              Propiedades
            </Link>
            <span>/</span>
            <span className="text-ink-soft/40">{p.city}</span>
          </nav>
        </div>

        {/* Gallery hero */}
        <section className="px-5 pt-6 md:px-10">
          <div className="mx-auto max-w-[1600px]">
            <PropertyGallery
              images={propertyImages(p)}
              alt={p.title}
              operationLabel={OPERATION_LABELS[p.operation]}
              featured={p.featured}
            />
          </div>
        </section>

        {/* Header: title/price/stats + contact card */}
        <section className="px-5 py-14 md:px-10 md:py-20">
          <div className="mx-auto grid max-w-[1600px] gap-12 lg:grid-cols-[1.6fr_1fr] lg:gap-20">
            {/* Main */}
            <div>
              <p className="text-eyebrow mb-4 text-sage-500">
                {TYPE_LABELS[p.type]} · {p.city}
              </p>
              <h1 className="font-display text-4xl leading-[1.05] text-ink md:text-6xl">
                {p.title}
              </h1>
              <p className="mt-3 text-lg text-ink-soft/70">{p.location}</p>
              <p className="mt-8 font-display text-4xl text-moss-600 md:text-5xl">
                {formatPrice(p)}
              </p>

              {/* Stats row */}
              <dl className="mt-10 grid grid-cols-2 gap-y-8 border-y border-moss-600/15 py-8 sm:grid-cols-4">
                {stats.map((s, i) => (
                  <div
                    key={i}
                    className={`px-2 ${
                      i > 0 ? "sm:border-l sm:border-moss-600/15" : ""
                    }`}
                  >
                    <dd className="font-display text-2xl text-ink md:text-3xl">
                      {s.value}
                    </dd>
                    <dt className="mt-1 text-[11px] uppercase tracking-[0.18em] text-sage-500">
                      {s.label}
                    </dt>
                  </div>
                ))}
              </dl>
            </div>

            {/* Contact card */}
            <aside className="lg:sticky lg:top-28 lg:self-start">
              <div className="rounded-3xl border border-moss-600/10 bg-mint-50/60 p-7 md:p-8">
                <p className="text-eyebrow text-sage-500">Asesoramiento</p>
                <p className="mt-3 font-display text-2xl text-ink">
                  NÚA Estudio Inmobiliario
                </p>
                <p className="mt-2 text-sm text-ink-soft/70">
                  Tus socias de confianza en San Rafael y toda Mendoza.
                </p>
                <a
                  href={`https://wa.me/${WHATSAPP}?text=${waText}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group mt-7 flex w-full items-center justify-center gap-3 rounded-full bg-moss-600 px-6 py-4 text-sm font-medium text-mint-100 transition-colors hover:bg-moss-700"
                >
                  Consultar por WhatsApp
                  <span className="transition-transform group-hover:translate-x-1">→</span>
                </a>
                <a
                  href={`mailto:${EMAIL}?subject=${encodeURIComponent("Consulta: " + p.title)}`}
                  className="mt-3 flex w-full items-center justify-center rounded-full border border-moss-600/20 px-6 py-4 text-sm text-moss-600 transition-colors hover:bg-moss-600/5"
                >
                  Consultar por email
                </a>
              </div>
            </aside>
          </div>
        </section>

        {/* Features */}
        {features.length > 0 && (
          <section className="border-t border-moss-600/10 px-5 py-14 md:px-10 md:py-20">
            <div className="mx-auto max-w-[1600px]">
              <p className="text-eyebrow mb-10 text-sage-500">Características</p>
              <ul className="grid grid-cols-2 gap-x-8 gap-y-5 sm:grid-cols-3 lg:grid-cols-4">
                {features.map((f) => (
                  <li
                    key={f}
                    className="flex items-center gap-3 border-b border-moss-600/10 pb-4 text-ink-soft"
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-mint-100 text-moss-600">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                    </span>
                    <span className="text-sm">{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {/* Description */}
        <section className="border-t border-moss-600/10 px-5 py-14 md:px-10 md:py-20">
          <div className="mx-auto grid max-w-[1600px] gap-10 lg:grid-cols-[0.4fr_1fr] lg:gap-20">
            <p className="text-eyebrow text-sage-500">Descripción</p>
            <div className="max-w-3xl">
              <p className="font-display text-2xl leading-[1.4] text-ink md:text-[1.9rem] md:leading-[1.45]">
                {p.description}
              </p>
              {p.highlights && (
                <ul className="mt-10 grid gap-4 sm:grid-cols-3">
                  {p.highlights.map((h, i) => (
                    <li
                      key={i}
                      className="rounded-2xl border border-moss-600/10 p-5"
                    >
                      <span className="font-display text-sm text-sage-400">
                        0{i + 1}
                      </span>
                      <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                        {h}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>

        {/* Map */}
        <section className="border-t border-moss-600/10 px-5 py-14 md:px-10 md:py-20">
          <div className="mx-auto max-w-[1600px]">
            <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-eyebrow mb-3 text-sage-500">Ubicación</p>
                <h2 className="font-display text-3xl text-ink md:text-4xl">
                  {p.location}
                </h2>
              </div>
              <span className="text-sm text-ink-soft/60">
                {p.zone} · {p.city}
                {p.boundary && p.boundary.length >= 3 && " · contorno del lote"}
              </span>
            </div>
            <div className="h-[55vh] min-h-[400px] w-full overflow-hidden rounded-2xl border border-moss-600/10">
              {p.boundary && p.boundary.length >= 3 ? (
                <LotBoundaryMapEmbed
                  property={p}
                  boundary={p.boundary}
                  showInfoCard={false}
                />
              ) : (
                <PropertyMapEmbed slug={p.slug} properties={properties} />
              )}
            </div>
          </div>
        </section>

        {/* Request information */}
        <section className="border-t border-moss-600/10 px-5 py-14 md:px-10 md:py-20">
          <div className="mx-auto grid max-w-[1600px] gap-12 lg:grid-cols-[0.5fr_1fr] lg:gap-20">
            <div>
              <p className="text-eyebrow mb-3 text-sage-500">
                Solicitar información
              </p>
              <h2 className="font-display text-3xl text-ink md:text-5xl">
                ¿Te interesa esta propiedad?
              </h2>
              <p className="mt-5 max-w-sm text-ink-soft/70">
                Dejanos tus datos y te contactamos a la brevedad para coordinar
                una visita o resolver tus dudas.
              </p>
            </div>
            <div className="rounded-3xl border border-moss-600/10 bg-mint-50/40 p-6 md:p-10">
              <PropertyInquiry propertyTitle={p.title} />
            </div>
          </div>
        </section>

        {/* Nearby */}
        {related.length > 0 && (
          <section className="border-t border-moss-600/10 px-5 py-16 md:px-10 md:py-24">
            <div className="mx-auto max-w-[1600px]">
              <div className="mb-12 flex items-end justify-between gap-6">
                <h2 className="font-display text-3xl text-ink md:text-5xl">
                  Otras propiedades
                </h2>
                <Link
                  href="/propiedades"
                  className="shrink-0 text-sm text-moss-600 underline-offset-4 hover:underline"
                >
                  Ver todas →
                </Link>
              </div>
              <div className="grid grid-cols-1 gap-x-6 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
                {related.map((rp, i) => (
                  <PropertyCard key={rp.slug} property={rp} index={i} />
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
      <Footer contact={settings.contact} />
    </>
  );
}
