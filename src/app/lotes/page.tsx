import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Logo from "@/components/Logo";
import { getStore } from "@/lib/store";
import { loteoStats } from "@/lib/loteos";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Loteos y desarrollos",
  description:
    "Elegí tu lote sobre el plano satelital. Loteos y desarrollos en San Rafael y Mendoza, con disponibilidad y precios en tiempo real.",
};

export default async function LotesPage() {
  const { loteos, settings } = await getStore();

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-bone">
        {/* Header */}
        <header className="relative overflow-hidden bg-celadon-400 px-6 pb-16 pt-36 text-moss-900 md:px-10 md:pb-24 md:pt-44">
          <div className="pointer-events-none absolute -bottom-[35%] -right-[4%] w-[55%] text-moss-900/[0.05] md:w-[40%]">
            <Logo className="h-auto w-full" />
          </div>
          <div className="relative mx-auto max-w-7xl">
            <p className="text-eyebrow mb-6 text-moss-700">
              Loteos y desarrollos
            </p>
            <h1 className="text-display font-display text-moss-900">
              Elegí tu lote sobre el plano
            </h1>
            <p className="mt-8 max-w-xl text-lg text-moss-900/70">
              Cada desarrollo tiene su plano satelital interactivo: tocás un lote
              y ves medida, precio y disponibilidad al instante.
            </p>
          </div>
        </header>

        <section className="mx-auto max-w-7xl px-5 py-14 md:px-10 md:py-20">
          {loteos.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-moss-600/20 py-20 text-center text-ink-soft/60">
              Todavía no hay loteos publicados. Volvé pronto.
            </p>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {loteos.map((l) => {
                const s = loteoStats(l);
                return (
                  <Link
                    key={l.slug}
                    href={`/lotes/${l.slug}`}
                    className="group flex flex-col overflow-hidden rounded-3xl border border-mint-200 bg-white/60 transition-shadow hover:shadow-lg"
                  >
                    <div className="relative aspect-[4/3] w-full overflow-hidden bg-bone-dark">
                      {l.image ? (
                        <Image
                          src={l.image}
                          alt={l.title}
                          fill
                          sizes="(max-width: 768px) 100vw, 33vw"
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-mint-100 text-sage-500">
                          <Logo className="h-10 w-auto opacity-40" />
                        </div>
                      )}
                      <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-moss-700 backdrop-blur">
                        {s.disponible} disponibles
                      </span>
                    </div>
                    <div className="flex flex-1 flex-col p-5">
                      <p className="text-xs uppercase tracking-wide text-ink-soft/60">
                        {l.zone} · {l.city}
                      </p>
                      <h2 className="mt-1 font-display text-2xl text-ink">
                        {l.title}
                      </h2>
                      <p className="mt-2 flex-1 text-sm text-ink-soft/70">
                        {s.total} lotes
                        {s.desde
                          ? ` · desde US$ ${s.desde.toLocaleString("es-AR")}`
                          : ""}
                      </p>
                      <span className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-sage-500 group-hover:text-moss-600">
                        Ver plano interactivo →
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </main>
      <Footer contact={settings.contact} />
    </>
  );
}
