import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LoteoMasterPlanEmbed from "@/components/LoteoMasterPlanEmbed";
import { getStore } from "@/lib/store";
import { findLoteo, loteoStats, LOT_STATUS_LABELS } from "@/lib/loteos";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { loteos } = await getStore();
  const loteo = findLoteo(loteos, slug);
  if (!loteo) return { title: "Loteo no encontrado" };
  return {
    title: loteo.title,
    description:
      loteo.description ??
      `Plano interactivo del ${loteo.title} en ${loteo.city}. Elegí tu lote.`,
  };
}

export default async function LoteoPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { loteos, settings } = await getStore();
  const loteo = findLoteo(loteos, slug);
  if (!loteo) notFound();

  const stats = loteoStats(loteo);

  return (
    <>
      <Navbar />
      <main className="bg-bone">
        <section className="mx-auto max-w-[1400px] px-5 py-14 md:px-10 md:py-20">
          <Link
            href="/lotes"
            className="text-sm text-ink-soft/60 transition-colors hover:text-moss-600"
          >
            ← Todos los loteos
          </Link>

          <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-eyebrow mb-2 flex items-center gap-3 text-sage-500">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-sage-500" />
                {loteo.zone} · {loteo.city}
              </p>
              <h1 className="font-display text-3xl text-ink md:text-5xl">
                {loteo.title}
              </h1>
              {loteo.location && (
                <p className="mt-2 text-sm text-ink-soft/70">{loteo.location}</p>
              )}
            </div>
            <div className="flex flex-wrap gap-2 text-xs font-medium">
              {(["disponible", "reservado", "vendido"] as const).map((st) => (
                <span
                  key={st}
                  className="rounded-full border border-mint-200 bg-white/60 px-3 py-1.5 text-ink-soft"
                >
                  {stats[st]} {LOT_STATUS_LABELS[st].toLowerCase()}
                </span>
              ))}
            </div>
          </div>

          {loteo.description && (
            <p className="mt-4 max-w-3xl text-sm leading-relaxed text-ink-soft/80">
              {loteo.description}
            </p>
          )}

          <div className="mt-8 h-[62vh] min-h-[460px] w-full overflow-hidden rounded-3xl border border-mint-200 shadow-sm">
            <LoteoMasterPlanEmbed
              loteo={loteo}
              phoneHref={settings.contact.phoneHref}
            />
          </div>

          <p className="mt-6 rounded-2xl bg-mint-50 px-5 py-4 text-xs text-ink-soft/70">
            <strong className="text-moss-600">Cómo funciona:</strong> la vista
            satelital es la foto aérea real del loteo; cada lote está dibujado y
            coloreado por estado. Tocá cualquiera para ver su medida, precio y
            disponibilidad, y consultá directo por WhatsApp.
          </p>
        </section>
      </main>
      <Footer contact={settings.contact} />
    </>
  );
}
