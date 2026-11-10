import "server-only";
import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import { supabase, STORE_TABLE } from "./supabase";

/*
 * Bandeja de consultas: lo que llega por los formularios de la web.
 *
 * Dónde se guarda:
 *  - Tabla `site_leads` (supabase/site_leads.sql): una fila por consulta.
 *  - Mientras esa tabla no exista, una fila JSON aparte (site_store id 3).
 *  - En desarrollo sin Supabase, data/leads.json.
 */

export type LeadKind = "consulta" | "contacto" | "tasacion";
export type LeadStatus = "nueva" | "contactada" | "cerrada" | "descartada";
export const LEAD_KINDS: LeadKind[] = ["consulta", "contacto", "tasacion"];
export const LEAD_STATUSES: LeadStatus[] = ["nueva", "contactada", "cerrada", "descartada"];

export type Lead = {
  id: string;
  createdAt: string;
  updatedAt: string;
  kind: LeadKind;
  name?: string;
  phone?: string;
  email?: string;
  message?: string;
  propertySlug?: string;
  propertyTitle?: string;
  details?: Record<string, string>;
  status: LeadStatus;
  notes?: string;
};

export type NewLead = Omit<Lead, "id" | "createdAt" | "updatedAt" | "status" | "notes">;

const TABLE = "site_leads";
/** Lo que dice la política de privacidad: se guardan como máximo 2 años. */
const KEEP_MS = 2 * 365 * 24 * 60 * 60 * 1000;
const LEGACY_ID = 3;
const FILE = path.join(process.cwd(), "data", "leads.json");

function isMissing(err: { code?: string; message?: string } | null) {
  if (!err) return false;
  return (
    ["PGRST205", "42P01"].includes(err.code ?? "") ||
    /could not find the table|does not exist/i.test(err.message ?? "")
  );
}

/* ----------------------- fila de la tabla <-> Lead ----------------------- */

type Row = {
  id: string;
  created_at: string;
  updated_at: string;
  kind: LeadKind;
  name: string | null;
  phone: string | null;
  email: string | null;
  message: string | null;
  property_slug: string | null;
  property_title: string | null;
  details: Record<string, string> | null;
  status: LeadStatus;
  notes: string | null;
};

const fromRow = (r: Row): Lead => ({
  id: r.id,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
  kind: r.kind,
  name: r.name ?? undefined,
  phone: r.phone ?? undefined,
  email: r.email ?? undefined,
  message: r.message ?? undefined,
  propertySlug: r.property_slug ?? undefined,
  propertyTitle: r.property_title ?? undefined,
  details: r.details ?? undefined,
  status: r.status,
  notes: r.notes ?? undefined,
});

/* --------------------- respaldo: lista JSON completa --------------------- */

async function readLegacy(): Promise<Lead[]> {
  const sb = supabase();
  if (sb) {
    const { data, error } = await sb
      .from(STORE_TABLE)
      .select("data")
      .eq("id", LEGACY_ID)
      .maybeSingle();
    if (error) throw error;
    return ((data?.data as { leads?: Lead[] })?.leads ?? []) as Lead[];
  }
  try {
    return JSON.parse(await fs.readFile(FILE, "utf8")) as Lead[];
  } catch {
    return [];
  }
}

async function writeLegacy(leads: Lead[]) {
  const sb = supabase();
  if (sb) {
    const { error } = await sb
      .from(STORE_TABLE)
      .upsert({ id: LEGACY_ID, data: { leads }, updated_at: new Date().toISOString() });
    if (error) throw error;
    return;
  }
  await fs.mkdir(path.dirname(FILE), { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(leads, null, 2), "utf8");
}

/* -------------------------------- API -------------------------------- */

export async function addLead(input: NewLead): Promise<void> {
  const now = new Date().toISOString();
  const lead: Lead = { ...input, id: randomUUID(), createdAt: now, updatedAt: now, status: "nueva" };
  const sb = supabase();
  if (sb) {
    const { error } = await sb.from(TABLE).insert({
      id: lead.id,
      kind: lead.kind,
      name: lead.name ?? null,
      phone: lead.phone ?? null,
      email: lead.email ?? null,
      message: lead.message ?? null,
      property_slug: lead.propertySlug ?? null,
      property_title: lead.propertyTitle ?? null,
      details: lead.details ?? {},
    });
    if (!error) {
      // De paso, se borran las de más de 2 años (si falla, no importa).
      await sb
        .from(TABLE)
        .delete()
        .lt("created_at", new Date(Date.now() - KEEP_MS).toISOString())
        .then(() => undefined, () => undefined);
      return;
    }
    if (!isMissing(error)) throw error;
  }
  const cutoff = new Date(Date.now() - KEEP_MS).toISOString();
  const all = (await readLegacy()).filter((l) => l.createdAt >= cutoff);
  await writeLegacy([lead, ...all].slice(0, 2000));
}

export async function listLeads(): Promise<Lead[]> {
  const sb = supabase();
  if (sb) {
    const { data, error } = await sb
      .from(TABLE)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1000);
    if (!error) return (data as Row[]).map(fromRow);
    if (!isMissing(error)) throw error;
  }
  return (await readLegacy()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function countNewLeads(): Promise<number> {
  const sb = supabase();
  if (sb) {
    const { count, error } = await sb
      .from(TABLE)
      .select("id", { count: "exact", head: true })
      .eq("status", "nueva");
    if (!error) return count ?? 0;
    if (!isMissing(error)) throw error;
  }
  return (await readLegacy()).filter((l) => l.status === "nueva").length;
}

export async function updateLead(
  id: string,
  patch: { status?: LeadStatus; notes?: string }
): Promise<void> {
  const now = new Date().toISOString();
  const sb = supabase();
  if (sb) {
    const { error } = await sb
      .from(TABLE)
      .update({ ...patch, updated_at: now })
      .eq("id", id);
    if (!error) return;
    if (!isMissing(error)) throw error;
  }
  const all = await readLegacy();
  await writeLegacy(all.map((l) => (l.id === id ? { ...l, ...patch, updatedAt: now } : l)));
}

export async function deleteLead(id: string): Promise<void> {
  const sb = supabase();
  if (sb) {
    const { error } = await sb.from(TABLE).delete().eq("id", id);
    if (!error) return;
    if (!isMissing(error)) throw error;
  }
  const all = await readLegacy();
  await writeLegacy(all.filter((l) => l.id !== id));
}
