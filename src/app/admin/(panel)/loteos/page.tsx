import Link from "next/link";
import { getStore } from "@/lib/store";
import { loteoStats } from "@/lib/loteos";
import { deleteLoteoAction } from "@/app/admin/actions";

export const dynamic = "force-dynamic";

export default async function AdminLoteos() {
  const { loteos } = await getStore();

  return (
    <div className="mx-auto max-w-5xl px-5 py-10 md:px-10 md:py-14">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-eyebrow text-sage-500">Contenido</p>
          <h1 className="mt-2 font-display text-4xl text-ink">Loteos</h1>
          <p className="mt-2 text-ink-soft/70">
            {loteos.length} desarrollo{loteos.length === 1 ? "" : "s"} con plano
            interactivo
          </p>
        </div>
        <Link
          href="/admin/loteos/nuevo"
          className="inline-flex items-center gap-2 rounded-full bg-moss-600 px-6 py-3 text-sm font-medium text-mint-100 transition-colors hover:bg-moss-700"
        >
          + Nuevo loteo
        </Link>
      </header>

      <div className="mt-8 space-y-3">
        {loteos.map((l) => {
          const s = loteoStats(l);
          return (
            <div
              key={l.slug}
              className="flex flex-wrap items-center gap-4 rounded-2xl border border-moss-600/10 bg-mint-50/20 p-4 transition-colors hover:bg-mint-50/50"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-ink">{l.title}</p>
                <p className="mt-0.5 text-xs text-sage-500">
                  {l.zone} · {l.city} · {s.total} lotes
                  {s.desde
                    ? ` · desde US$ ${s.desde.toLocaleString("es-AR")}`
                    : ""}
                </p>
                <p className="mt-1 flex gap-3 text-xs text-ink-soft/60">
                  <span>{s.disponible} disponibles</span>
                  <span>{s.reservado} reservados</span>
                  <span>{s.vendido} vendidos</span>
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Link
                  href={`/lotes/${l.slug}`}
                  target="_blank"
                  className="rounded-full px-3 py-2 text-sm text-ink-soft/60 transition-colors hover:bg-mint-100 hover:text-moss-600"
                >
                  Ver
                </Link>
                <Link
                  href={`/admin/loteos/${l.slug}`}
                  className="rounded-full px-4 py-2 text-sm text-moss-600 transition-colors hover:bg-mint-100"
                >
                  Editar
                </Link>
                <form action={deleteLoteoAction}>
                  <input type="hidden" name="slug" value={l.slug} />
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
          );
        })}
        {loteos.length === 0 && (
          <p className="rounded-2xl border border-dashed border-moss-600/20 py-16 text-center text-ink-soft/60">
            Todavía no hay loteos. Creá el primero.
          </p>
        )}
      </div>
    </div>
  );
}
