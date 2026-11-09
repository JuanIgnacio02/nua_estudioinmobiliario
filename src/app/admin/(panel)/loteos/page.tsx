import Link from "next/link";
import { getStore } from "@/lib/store";
import { loteoStats, LOT_STATUS_COLORS } from "@/lib/loteos";
import { deleteLoteoAction } from "@/app/admin/actions";
import DeleteButton from "@/components/admin/DeleteButton";

export const dynamic = "force-dynamic";

export default async function AdminLoteos() {
  const { loteos } = await getStore();

  return (
    <div className="admin-page mx-auto max-w-5xl px-5 py-10 md:px-10 md:py-14">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-eyebrow text-sage-600">Contenido</p>
          <h1 className="mt-2 font-display text-4xl text-ink">Loteos</h1>
          <p className="mt-2 text-ink-soft/70">
            {loteos.length} desarrollo{loteos.length === 1 ? "" : "s"} con plano
            interactivo
          </p>
        </div>
        <Link href="/admin/loteos/nuevo" className="glass-btn-primary">
          + Nuevo loteo
        </Link>
      </header>

      <ul className="mt-8 space-y-3">
        {loteos.map((l) => {
          const s = loteoStats(l);
          const pct = (n: number) => (s.total ? (n / s.total) * 100 : 0);
          return (
            <li
              key={l.slug}
              className="glass-panel glass-card group relative flex items-center gap-4 p-4 md:p-5"
            >
              <div className="min-w-0 flex-1">
                <Link
                  href={`/admin/loteos/${l.slug}`}
                  className="font-medium text-ink after:absolute after:inset-0 after:rounded-[1.375rem] after:content-['']"
                >
                  {l.title}
                </Link>
                <p className="mt-0.5 truncate text-xs text-sage-600">
                  {[l.zone, l.city].filter(Boolean).join(" · ")} · {s.total} lote
                  {s.total === 1 ? "" : "s"}
                  {s.desde ? ` · desde US$ ${s.desde.toLocaleString("es-AR")}` : ""}
                </p>

                {/* Avance de ventas */}
                {s.total > 0 ? (
                  <div className="mt-3 max-w-md">
                    <div className="flex h-1.5 overflow-hidden rounded-full bg-moss-900/8">
                      <span style={{ width: `${pct(s.vendido)}%`, background: LOT_STATUS_COLORS.vendido.fill }} />
                      <span style={{ width: `${pct(s.reservado)}%`, background: LOT_STATUS_COLORS.reservado.fill }} />
                      <span style={{ width: `${pct(s.disponible)}%`, background: LOT_STATUS_COLORS.disponible.fill }} />
                    </div>
                    <p className="mt-1.5 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-ink-soft/65">
                      <Legend color={LOT_STATUS_COLORS.disponible.fill} n={s.disponible} label="disponibles" />
                      <Legend color={LOT_STATUS_COLORS.reservado.fill} n={s.reservado} label="reservados" />
                      <Legend color={LOT_STATUS_COLORS.vendido.fill} n={s.vendido} label="vendidos" />
                    </p>
                  </div>
                ) : (
                  <p className="mt-2 text-xs text-[#7a5310]">
                    Sin lotes dibujados todavía
                  </p>
                )}
              </div>

              <div className="flex shrink-0 items-center">
                <Link
                  href={`/lotes/${l.slug}`}
                  target="_blank"
                  aria-label={`Ver «${l.title}» en la web`}
                  title="Ver en la web"
                  className="relative z-10 flex h-9 w-9 items-center justify-center rounded-full text-ink-soft/50 transition-colors hover:bg-white/80 hover:text-moss-700"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14 21 3" />
                  </svg>
                </Link>
                <span
                  aria-hidden
                  className="mx-1 hidden rounded-full px-3.5 py-1.5 text-sm font-medium text-moss-700 transition-colors group-hover:bg-white/80 sm:inline-flex"
                >
                  Editar
                </span>
                <DeleteButton
                  action={deleteLoteoAction}
                  slug={l.slug}
                  name={l.title}
                  kind="loteo"
                />
              </div>
            </li>
          );
        })}
      </ul>

      {loteos.length === 0 && (
        <div className="glass-panel px-6 py-16 text-center">
          <p className="text-ink-soft/70">Todavía no hay loteos.</p>
          <Link href="/admin/loteos/nuevo" className="glass-btn-primary mt-5">
            + Crear el primero
          </Link>
        </div>
      )}
    </div>
  );
}

function Legend({ color, n, label }: { color: string; n: number; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="h-2 w-2 rounded-full" style={{ background: color }} aria-hidden />
      <span className="font-medium text-ink">{n}</span> {label}
    </span>
  );
}
