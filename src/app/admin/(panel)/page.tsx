import Link from "next/link";
import { getStore } from "@/lib/store";
import { formatPrice, TYPE_LABELS } from "@/lib/properties";

export default async function AdminDashboard() {
  const { properties } = await getStore();
  const featured = properties.filter((p) => p.featured).length;
  const venta = properties.filter((p) => p.operation === "venta").length;
  const alquiler = properties.filter((p) => p.operation === "alquiler").length;
  const withCoords = properties.filter((p) => p.coords).length;

  const stats = [
    { label: "Propiedades", value: properties.length },
    { label: "Destacadas", value: featured },
    { label: "En venta", value: venta },
    { label: "En alquiler", value: alquiler },
  ];

  return (
    <div className="mx-auto max-w-5xl px-5 py-10 md:px-10 md:py-14">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-eyebrow text-sage-500">Panel</p>
          <h1 className="mt-2 font-display text-4xl text-ink md:text-5xl">
            Hola de nuevo 👋
          </h1>
          <p className="mt-2 text-ink-soft/70">
            Gestioná las propiedades y el contenido de la web.
          </p>
        </div>
        <Link
          href="/admin/propiedades/nueva"
          className="inline-flex items-center gap-2 rounded-full bg-moss-600 px-6 py-3 text-sm font-medium text-mint-100 transition-colors hover:bg-moss-700"
        >
          + Nueva propiedad
        </Link>
      </header>

      {/* Stats */}
      <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-2xl border border-moss-600/10 bg-mint-50/40 p-5"
          >
            <p className="font-display text-4xl text-moss-600">{s.value}</p>
            <p className="mt-1 text-xs uppercase tracking-[0.16em] text-sage-500">
              {s.label}
            </p>
          </div>
        ))}
      </div>

      {withCoords < properties.length && (
        <div className="mt-6 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-5 py-4 text-sm text-amber-800">
          {properties.length - withCoords} propiedad(es) sin ubicación en el
          mapa. Editalas y cargá la dirección para geolocalizarlas.
        </div>
      )}

      {/* Quick access */}
      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        <QuickCard
          href="/admin/propiedades"
          title="Propiedades"
          desc="Crear, editar y borrar propiedades."
        />
        <QuickCard
          href="/admin/contacto"
          title="Contacto"
          desc="Email y WhatsApp de toda la web."
        />
        <QuickCard
          href="/admin/nosotras"
          title="Sobre nosotras"
          desc="Foto del equipo, misión y valores."
        />
      </div>

      {/* Recent */}
      <section className="mt-12">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-2xl text-ink">Propiedades</h2>
          <Link
            href="/admin/propiedades"
            className="text-sm text-moss-600 hover:underline"
          >
            Ver todas →
          </Link>
        </div>
        <div className="divide-y divide-moss-600/10 overflow-hidden rounded-2xl border border-moss-600/10">
          {properties.slice(0, 5).map((p) => (
            <Link
              key={p.slug}
              href={`/admin/propiedades/${p.slug}`}
              className="flex items-center justify-between gap-4 bg-mint-50/20 px-5 py-4 transition-colors hover:bg-mint-100/50"
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-ink">{p.title}</p>
                <p className="text-xs text-sage-500">
                  {TYPE_LABELS[p.type]} · {p.city}
                  {!p.coords && " · ⚠ sin mapa"}
                </p>
              </div>
              <span className="shrink-0 font-display text-lg text-moss-600">
                {formatPrice(p)}
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

function QuickCard({
  href,
  title,
  desc,
}: {
  href: string;
  title: string;
  desc: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-2xl border border-moss-600/10 p-6 transition-colors hover:border-moss-600/30 hover:bg-mint-50/40"
    >
      <p className="font-display text-xl text-ink group-hover:text-moss-600">
        {title}
      </p>
      <p className="mt-2 text-sm text-ink-soft/70">{desc}</p>
      <span className="mt-4 inline-block text-sm text-moss-600">Abrir →</span>
    </Link>
  );
}
