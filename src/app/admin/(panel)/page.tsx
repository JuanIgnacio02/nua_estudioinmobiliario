import Link from "next/link";
import { getStore } from "@/lib/store";
import {
  formatPrice,
  formatArea,
  publishedProperties,
  TYPE_LABELS,
  type PropertyType,
} from "@/lib/properties";
import { loteoStats } from "@/lib/loteos";

export const dynamic = "force-dynamic";

const money = (n: number) => `US$ ${Math.round(n).toLocaleString("es-AR")}`;

export default async function AdminDashboard() {
  const { properties, loteos } = await getStore();
  const publicadas = publishedProperties(properties);
  const borradores = properties.length - publicadas.length;
  const sinMapa = properties.filter((p) => !p.coords).length;

  // Cartera: solo lo que está publicado (es lo que realmente está a la venta).
  const valorCartera = publicadas.reduce((acc, p) => acc + p.price, 0);
  const conSuperficie = publicadas.filter((p) => p.area > 0 && p.price > 0);
  const precioM2 = conSuperficie.length
    ? conSuperficie.reduce((acc, p) => acc + p.price / p.area, 0) /
      conSuperficie.length
    : 0;

  // Loteos
  const lotesTotal = loteos.reduce((a, l) => a + l.lots.length, 0);
  const lotesDisponibles = loteos.reduce(
    (a, l) => a + loteoStats(l).disponible,
    0
  );

  // Desgloses
  const porTipo = (Object.keys(TYPE_LABELS) as PropertyType[])
    .map((t) => ({
      label: TYPE_LABELS[t],
      n: publicadas.filter((p) => p.type === t).length,
    }))
    .filter((x) => x.n > 0)
    .sort((a, b) => b.n - a.n);

  const porZona = Object.entries(
    publicadas.reduce<Record<string, number>>((acc, p) => {
      acc[p.zone] = (acc[p.zone] ?? 0) + 1;
      return acc;
    }, {})
  )
    .map(([label, n]) => ({ label, n }))
    .sort((a, b) => b.n - a.n)
    .slice(0, 5);

  const kpis = [
    { label: "Valor de cartera", value: money(valorCartera), sub: `${publicadas.length} publicadas` },
    { label: "Precio promedio", value: precioM2 ? `${money(precioM2)}/m²` : "—", sub: `sobre ${conSuperficie.length} con superficie` },
    { label: "Lotes disponibles", value: lotesTotal ? `${lotesDisponibles}` : "—", sub: lotesTotal ? `de ${lotesTotal} en ${loteos.length} loteo${loteos.length === 1 ? "" : "s"}` : "sin loteos cargados" },
    { label: "En borrador", value: `${borradores}`, sub: borradores ? "no se ven en la web" : "todo publicado" },
  ];

  return (
    <div className="mx-auto max-w-5xl px-5 py-10 md:px-10 md:py-14">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-eyebrow text-sage-600">Panel</p>
          <h1 className="mt-2 font-display text-4xl text-ink md:text-5xl">
            Hola de nuevo
          </h1>
          <p className="mt-2 text-ink-soft/70">
            Gestioná las propiedades, los loteos y el contenido de la web.
          </p>
        </div>
        <Link href="/admin/propiedades/nueva" className="glass-btn-primary">
          + Nueva propiedad
        </Link>
      </header>

      {/* KPIs */}
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="glass-panel p-5">
            <p className="text-[0.68rem] uppercase tracking-[0.16em] text-sage-600">
              {k.label}
            </p>
            <p className="mt-2 font-display text-3xl leading-none text-moss-700">
              {k.value}
            </p>
            <p className="mt-2 text-xs text-ink-soft/60">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Avisos */}
      {(sinMapa > 0 || borradores > 0) && (
        <div className="mt-4 flex flex-wrap gap-3">
          {sinMapa > 0 && (
            <p className="glass-panel px-5 py-3 text-sm text-ink-soft/80">
              ⚠ {sinMapa} propiedad{sinMapa === 1 ? "" : "es"} sin ubicación en
              el mapa.{" "}
              <Link
                href="/admin/propiedades"
                className="font-medium text-moss-700 underline underline-offset-2"
              >
                Revisar
              </Link>
            </p>
          )}
          {borradores > 0 && (
            <p className="glass-panel px-5 py-3 text-sm text-ink-soft/80">
              ✎ {borradores} en borrador, sin publicar.
            </p>
          )}
        </div>
      )}

      {/* Desgloses */}
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Breakdown title="Por tipo" items={porTipo} total={publicadas.length} />
        <Breakdown title="Por zona" items={porZona} total={publicadas.length} />
      </div>

      {/* Recientes */}
      <section className="mt-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-2xl text-ink">Últimas cargadas</h2>
          <Link
            href="/admin/propiedades"
            className="text-sm text-moss-700 hover:underline"
          >
            Ver todas →
          </Link>
        </div>
        <div className="space-y-2">
          {properties.slice(0, 5).map((p) => (
            <Link
              key={p.slug}
              href={`/admin/propiedades/${p.slug}`}
              className="glass-panel glass-card flex items-center justify-between gap-4 px-5 py-3.5"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate font-medium text-ink">{p.title}</p>
                  {p.draft && (
                    <span className="glass-chip glass-chip--draft">
                      Borrador
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-sage-600">
                  {TYPE_LABELS[p.type]} · {p.zone} · {formatArea(p.area)}
                </p>
              </div>
              <span className="shrink-0 font-display text-lg text-moss-700">
                {formatPrice(p)}
              </span>
            </Link>
          ))}
          {properties.length === 0 && (
            <p className="glass-panel px-6 py-14 text-center text-ink-soft/60">
              Todavía no hay propiedades cargadas.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

/** Lista con barra proporcional — se lee de un vistazo sin ser un gráfico. */
function Breakdown({
  title,
  items,
  total,
}: {
  title: string;
  items: { label: string; n: number }[];
  total: number;
}) {
  const max = Math.max(1, ...items.map((i) => i.n));
  return (
    <div className="glass-panel p-5">
      <p className="text-[0.68rem] uppercase tracking-[0.16em] text-sage-600">
        {title}
      </p>
      {items.length === 0 ? (
        <p className="mt-4 text-sm text-ink-soft/60">Sin datos todavía.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {items.map((i) => (
            <li key={i.label}>
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="truncate text-ink-soft/85">{i.label}</span>
                <span className="shrink-0 font-medium text-ink">
                  {i.n}
                  <span className="ml-1 text-xs font-normal text-ink-soft/50">
                    {total ? `${Math.round((i.n / total) * 100)}%` : ""}
                  </span>
                </span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-moss-900/8">
                <div
                  className="h-full rounded-full bg-celadon-400"
                  style={{ width: `${(i.n / max) * 100}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
