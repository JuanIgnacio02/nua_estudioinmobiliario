import Link from "next/link";
import Image from "next/image";
import { getStore } from "@/lib/store";
import {
  formatPrice,
  formatArea,
  TYPE_LABELS,
  OPERATION_LABELS,
} from "@/lib/properties";
import { deletePropertyAction } from "@/app/admin/actions";

export const dynamic = "force-dynamic";

export default async function AdminProperties() {
  const { properties } = await getStore();

  return (
    <div className="mx-auto max-w-5xl px-5 py-10 md:px-10 md:py-14">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-eyebrow text-sage-500">Contenido</p>
          <h1 className="mt-2 font-display text-4xl text-ink">Propiedades</h1>
          <p className="mt-2 text-ink-soft/70">{properties.length} en total</p>
        </div>
        <Link
          href="/admin/propiedades/nueva"
          className="inline-flex items-center gap-2 rounded-full bg-moss-600 px-6 py-3 text-sm font-medium text-mint-100 transition-colors hover:bg-moss-700"
        >
          + Nueva propiedad
        </Link>
      </header>

      <div className="mt-8 space-y-3">
        {properties.map((p) => (
          <div
            key={p.slug}
            className="flex items-center gap-4 rounded-2xl border border-moss-600/10 bg-mint-50/20 p-3 transition-colors hover:bg-mint-50/50"
          >
            <div className="relative h-16 w-20 shrink-0 overflow-hidden rounded-xl bg-bone-dark">
              <Image
                src={p.image}
                alt={p.title}
                fill
                className="object-cover"
                sizes="80px"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-ink">{p.title}</p>
              <p className="mt-0.5 text-xs text-sage-500">
                {OPERATION_LABELS[p.operation]} · {TYPE_LABELS[p.type]} ·{" "}
                {formatArea(p.area)}
                {p.featured && " · ★ destacada"}
                {!p.coords && " · ⚠ sin mapa"}
              </p>
            </div>
            <span className="hidden shrink-0 font-display text-lg text-moss-600 sm:block">
              {formatPrice(p)}
            </span>
            <div className="flex shrink-0 items-center gap-1">
              <Link
                href={`/admin/propiedades/${p.slug}`}
                className="rounded-full px-4 py-2 text-sm text-moss-600 transition-colors hover:bg-mint-100"
              >
                Editar
              </Link>
              <form action={deletePropertyAction}>
                <input type="hidden" name="slug" value={p.slug} />
                <button
                  type="submit"
                  className="rounded-full px-3 py-2 text-sm text-ink-soft/50 transition-colors hover:bg-red-500/10 hover:text-red-600"
                  title="Borrar"
                >
                  Borrar
                </button>
              </form>
            </div>
          </div>
        ))}
        {properties.length === 0 && (
          <p className="rounded-2xl border border-dashed border-moss-600/20 py-16 text-center text-ink-soft/60">
            Todavía no hay propiedades. Creá la primera.
          </p>
        )}
      </div>
    </div>
  );
}
