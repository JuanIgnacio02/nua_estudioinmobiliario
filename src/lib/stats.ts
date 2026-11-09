import "server-only";
import { promises as fs } from "fs";
import path from "path";
import { supabase, STORE_TABLE } from "./supabase";

/*
 * Estadísticas anónimas: visitas a cada ficha y clics en WhatsApp.
 * Sin cookies ni datos personales: solo contadores por día y por propiedad.
 *
 * Viven en una fila APARTE de la tabla (id 2), nunca en la del catálogo: así
 * un contador no puede pisar lo que se guarda desde el admin.
 */

export type EventKind = "view" | "whatsapp" | "tasacion";
export const EVENT_KINDS: EventKind[] = ["view", "whatsapp", "tasacion"];

/** Clave para lo que no es de una propiedad (inicio, contacto, tasaciones). */
export const GENERAL = "_general";

type Counts = Partial<Record<EventKind, number>>;
/** days["2026-11-09"]["casa-en-x"] = { view: 12, whatsapp: 2 } */
export type Stats = { days: Record<string, Record<string, Counts>> };

const STATS_ID = 2;
const KEEP_DAYS = 400;
const FILE = path.join(process.cwd(), "data", "stats.json");

/** Fecha del día en San Rafael. */
function today() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Argentina/Mendoza",
  }).format(new Date());
}

async function read(): Promise<Stats> {
  const sb = supabase();
  if (sb) {
    const { data, error } = await sb
      .from(STORE_TABLE)
      .select("data")
      .eq("id", STATS_ID)
      .maybeSingle();
    if (error) throw error;
    return (data?.data as Stats) ?? { days: {} };
  }
  try {
    return JSON.parse(await fs.readFile(FILE, "utf8")) as Stats;
  } catch {
    return { days: {} };
  }
}

async function write(stats: Stats) {
  const sb = supabase();
  if (sb) {
    const { error } = await sb
      .from(STORE_TABLE)
      .upsert({ id: STATS_ID, data: stats, updated_at: new Date().toISOString() });
    if (error) throw error;
    return;
  }
  await fs.mkdir(path.dirname(FILE), { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(stats), "utf8");
}

export async function recordEvent(slug: string, kind: EventKind) {
  const stats = await read();
  const day = today();
  const bucket = (stats.days[day] ??= {});
  const counts = (bucket[slug] ??= {});
  counts[kind] = (counts[kind] ?? 0) + 1;
  // Se guardan ~13 meses: alcanza para comparar y no crece sin fin.
  const days = Object.keys(stats.days).sort();
  for (const d of days.slice(0, Math.max(0, days.length - KEEP_DAYS))) {
    delete stats.days[d];
  }
  await write(stats);
}

export type StatsSummary = {
  days: number;
  totals: Record<EventKind, number>;
  bySlug: { slug: string; view: number; whatsapp: number }[];
  /** Visitas por día (para el gráfico), del más viejo al más nuevo. */
  daily: { day: string; view: number; whatsapp: number }[];
};

/** Resumen de los últimos `days` días. Si falla, devuelve null (no rompe el panel). */
export async function getStatsSummary(days = 30): Promise<StatsSummary | null> {
  let stats: Stats;
  try {
    stats = await read();
  } catch (e) {
    console.error("[stats] no se pudieron leer:", e);
    return null;
  }
  const totals: Record<EventKind, number> = { view: 0, whatsapp: 0, tasacion: 0 };
  const per = new Map<string, { view: number; whatsapp: number }>();
  const daily: StatsSummary["daily"] = [];
  const end = new Date(`${today()}T12:00:00Z`);
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(end.getTime() - i * 86_400_000).toISOString().slice(0, 10);
    const bucket = stats.days[d] ?? {};
    let v = 0;
    let w = 0;
    for (const [slug, c] of Object.entries(bucket)) {
      for (const k of EVENT_KINDS) totals[k] += c[k] ?? 0;
      v += c.view ?? 0;
      w += c.whatsapp ?? 0;
      if (slug === GENERAL) continue;
      const acc = per.get(slug) ?? { view: 0, whatsapp: 0 };
      acc.view += c.view ?? 0;
      acc.whatsapp += c.whatsapp ?? 0;
      per.set(slug, acc);
    }
    daily.push({ day: d, view: v, whatsapp: w });
  }
  const bySlug = [...per.entries()]
    .map(([slug, c]) => ({ slug, ...c }))
    .sort((a, b) => b.whatsapp - a.whatsapp || b.view - a.view);
  return { days, totals, bySlug, daily };
}
