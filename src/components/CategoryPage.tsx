import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PropertyCard from "@/components/PropertyCard";
import AnimatedHeading from "@/components/anim/AnimatedHeading";
import Logo from "@/components/Logo";
import JsonLd from "@/components/JsonLd";
import { breadcrumbJsonLd } from "@/lib/seo";
import type { Property, SiteSettings } from "@/lib/properties";

/** Listado de una categoría (por tipo o por zona), pensado para Google. */
export default function CategoryPage({
  settings,
  eyebrow,
  title,
  intro,
  path,
  properties,
  explorerHref,
  related,
  emptyText,
}: {
  settings: SiteSettings;
  eyebrow: string;
  title: string;
  intro: string;
  path: string;
  properties: Property[];
  explorerHref: string;
  related: { label: string; href: string; count: number }[];
  emptyText: string;
}) {
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Inicio", path: "/" },
          { name: "Propiedades", path: "/propiedades" },
          { name: title, path },
        ])}
      />
      <Navbar contact={settings.contact} />
      <main className="pb-28">
        <header className="relative overflow-hidden bg-celadon-400 px-6 pb-16 pt-36 text-moss-900 md:px-10 md:pb-24 md:pt-44">
          <div aria-hidden className="pointer-events-none absolute -bottom-[35%] -right-[4%] w-[55%] text-moss-900/[0.05] md:w-[40%]">
            <Logo className="h-auto w-full" />
          </div>
          <div className="relative mx-auto max-w-7xl">
            <nav className="mb-6 flex flex-wrap items-center gap-2 text-xs text-moss-900/60">
              <Link href="/" className="hover:text-moss-900">Inicio</Link>
              <span>/</span>
              <Link href="/propiedades" className="hover:text-moss-900">Propiedades</Link>
              <span>/</span>
              <span>{eyebrow}</span>
            </nav>
            <AnimatedHeading
              as="h1"
              immediate
              text={title}
              className="text-display max-w-[16ch] font-display text-moss-900"
            />
            <p className="mt-8 max-w-xl text-lg text-moss-900/70">{intro}</p>
          </div>
        </header>

        <div className="mx-auto max-w-7xl px-6 md:px-10">
          <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-b border-moss-600/10 pb-6">
            <p className="text-sm text-ink-soft/70">
              {properties.length === 0
                ? "Sin propiedades publicadas por ahora"
                : `${properties.length} ${properties.length === 1 ? "propiedad" : "propiedades"}`}
            </p>
            <Link
              href={explorerHref}
              className="text-sm text-moss-600 underline-offset-4 hover:underline"
            >
              Filtrar por precio, zona y más →
            </Link>
          </div>

          {properties.length > 0 ? (
            <div className="mt-12 grid grid-cols-1 gap-x-6 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
              {properties.map((p, i) => (
                <PropertyCard key={p.slug} property={p} index={i} eager={i < 2} />
              ))}
            </div>
          ) : (
            <div className="mt-16 max-w-lg">
              <p className="text-ink-soft/75">{emptyText}</p>
              <a
                href={`https://wa.me/${settings.contact.phoneHref}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex min-h-11 items-center rounded-full bg-moss-600 px-6 py-3 text-sm text-mint-100 transition-colors hover:bg-moss-700"
              >
                Contanos qué buscás
              </a>
            </div>
          )}

          {related.length > 0 && (
            <section className="mt-24 border-t border-moss-600/10 pt-12">
              <h2 className="text-eyebrow font-sans leading-normal text-sage-500">
                Otras búsquedas
              </h2>
              <ul className="mt-6 flex flex-wrap gap-3">
                {related.map((r) => (
                  <li key={r.href}>
                    <Link
                      href={r.href}
                      className="inline-flex items-center gap-2 rounded-full border border-moss-600/15 px-4 py-2 text-sm text-ink-soft transition-colors hover:border-moss-600/40 hover:text-moss-700"
                    >
                      {r.label}
                      <span className="text-xs text-ink-soft/45">{r.count}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </main>
      <Footer contact={settings.contact} />
    </>
  );
}
