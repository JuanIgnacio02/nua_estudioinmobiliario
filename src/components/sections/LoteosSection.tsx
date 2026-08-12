import Link from "next/link";
import AnimatedHeading from "@/components/anim/AnimatedHeading";
import LoteoMasterPlanEmbed from "@/components/LoteoMasterPlanEmbed";
import { loteoStats, LOT_STATUS_COLORS, type Loteo } from "@/lib/loteos";

/**
 * Bloque de loteos en la home. Muestra el master plan del primer loteo en vivo
 * — el plano interactivo es el diferencial, así que se ve sin salir de la home.
 */
export default function LoteosSection({
  loteos,
  phoneHref,
}: {
  loteos: Loteo[];
  phoneHref: string;
}) {
  if (!loteos.length) return null;

  const featured = loteos[0];
  const stats = loteoStats(featured);

  return (
    <section id="loteos" className="bg-mint-50 py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-6 md:px-10">
        <div className="grid items-center gap-10 lg:grid-cols-[1fr_1.15fr] lg:gap-16">
          {/* Texto */}
          <div>
            <p className="text-eyebrow mb-5 text-sage-500">
              Loteos y desarrollos
            </p>
            <AnimatedHeading
              text="Elegí tu lote sobre el plano"
              className="font-display text-ink text-[clamp(2.25rem,5vw,4rem)] leading-[0.98]"
            />
            <p className="mt-6 max-w-md text-lg leading-relaxed text-ink-soft/75">
              Cada desarrollo tiene su vista satelital interactiva: tocás un lote
              y ves su medida, precio y disponibilidad al instante.
            </p>

            {/* Estado del loteo destacado */}
            <div className="mt-8 rounded-2xl border border-mint-200 bg-white/60 p-5">
              <p className="font-display text-2xl text-ink">{featured.title}</p>
              <p className="mt-1 text-sm text-ink-soft/60">
                {featured.zone} · {featured.city}
              </p>
              <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm">
                {(["disponible", "reservado", "vendido"] as const).map((st) => (
                  <li key={st} className="flex items-center gap-2">
                    <span
                      className="inline-block h-3 w-3 rounded-sm"
                      style={{
                        background: LOT_STATUS_COLORS[st].fill,
                        border: `1.5px solid ${LOT_STATUS_COLORS[st].stroke}`,
                      }}
                    />
                    <span className="text-ink-soft/80">
                      <span className="font-semibold text-ink">{stats[st]}</span>{" "}
                      {st === "disponible"
                        ? "disponibles"
                        : st === "reservado"
                          ? "reservados"
                          : "vendidos"}
                    </span>
                  </li>
                ))}
              </ul>
              {stats.desde && (
                <p className="mt-3 border-t border-mint-200 pt-3 text-sm text-ink-soft/70">
                  Desde{" "}
                  <span className="font-display text-lg text-moss-600">
                    US$ {stats.desde.toLocaleString("es-AR")}
                  </span>
                </p>
              )}
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href={`/lotes/${featured.slug}`}
                className="group inline-flex items-center gap-3 rounded-full bg-moss-600 px-7 py-3.5 text-sm font-medium text-mint-100 transition-colors hover:bg-moss-700"
              >
                Ver plano interactivo
                <span className="transition-transform group-hover:translate-x-1">
                  →
                </span>
              </Link>
              {loteos.length > 1 && (
                <Link
                  href="/lotes"
                  className="inline-flex items-center gap-2 rounded-full border border-moss-600/20 px-6 py-3.5 text-sm text-moss-600 transition-colors hover:bg-mint-100"
                >
                  Todos los loteos ({loteos.length})
                </Link>
              )}
            </div>
          </div>

          {/* Master plan en vivo */}
          <div className="h-[380px] overflow-hidden rounded-3xl border border-mint-200 shadow-sm md:h-[480px]">
            <LoteoMasterPlanEmbed loteo={featured} phoneHref={phoneHref} />
          </div>
        </div>
      </div>
    </section>
  );
}
