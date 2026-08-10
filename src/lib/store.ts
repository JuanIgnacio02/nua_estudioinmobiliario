import "server-only";
import { promises as fs } from "fs";
import path from "path";
import {
  seedProperties,
  defaultSettings,
  type Property,
  type SiteSettings,
} from "./properties";
import { seedLoteos, type Loteo } from "./loteos";
import { supabase, STORE_TABLE, STORE_ID } from "./supabase";

/**
 * Site store. Uses Supabase (single JSONB row) when configured — the
 * production driver for Vercel — and falls back to a local JSON file for dev.
 */

export type Store = {
  properties: Property[];
  loteos: Loteo[];
  settings: SiteSettings;
};

const DATA_DIR = path.join(process.cwd(), "data");
const STORE_PATH = path.join(DATA_DIR, "store.json");

function normalize(partial: Partial<Store> | null | undefined): Store {
  return {
    properties: partial?.properties ?? seedProperties,
    loteos: partial?.loteos ?? seedLoteos,
    settings: { ...defaultSettings, ...partial?.settings },
  };
}

/* ------------------------------ file driver ------------------------------ */

async function fileGet(): Promise<Store> {
  try {
    const raw = await fs.readFile(STORE_PATH, "utf8");
    return normalize(JSON.parse(raw) as Partial<Store>);
  } catch {
    const seeded = normalize(null);
    try {
      await fs.mkdir(DATA_DIR, { recursive: true });
      await fs.writeFile(STORE_PATH, JSON.stringify(seeded, null, 2), "utf8");
    } catch {
      /* read-only fs — serve in-memory seed */
    }
    return seeded;
  }
}

async function fileSave(store: Store): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(STORE_PATH, JSON.stringify(store, null, 2), "utf8");
}

/* ---------------------------- supabase driver ---------------------------- */

async function supaGet(): Promise<Store> {
  const sb = supabase()!;
  const { data, error } = await sb
    .from(STORE_TABLE)
    .select("data")
    .eq("id", STORE_ID)
    .maybeSingle();

  if (error) throw error;

  if (!data) {
    // First run: seed the single row.
    const seeded = normalize(null);
    await sb.from(STORE_TABLE).upsert({ id: STORE_ID, data: seeded });
    return seeded;
  }
  return normalize(data.data as Partial<Store>);
}

async function supaSave(store: Store): Promise<void> {
  const sb = supabase()!;
  const { error } = await sb
    .from(STORE_TABLE)
    .upsert({ id: STORE_ID, data: store, updated_at: new Date().toISOString() });
  if (error) throw error;
}

/* ------------------------------- public API ------------------------------ */

/** Resilient read for the public site — never throws (falls back to seed). */
export async function getStore(): Promise<Store> {
  if (supabase()) {
    try {
      return await supaGet();
    } catch (e) {
      console.error("[store] Supabase read failed, using seed:", e);
      return normalize(null);
    }
  }
  return fileGet();
}

/**
 * Strict read used before a write. If the Supabase read fails we THROW instead
 * of silently returning the seed — otherwise a mutation could overwrite the
 * real catalog with seed-based data and wipe the user's properties.
 */
async function getStoreForWrite(): Promise<Store> {
  if (supabase()) return supaGet();
  return fileGet();
}

export async function saveStore(store: Store): Promise<void> {
  if (supabase()) return supaSave(store);
  return fileSave(store);
}

export async function getProperties(): Promise<Property[]> {
  return (await getStore()).properties;
}

export async function getSettings(): Promise<SiteSettings> {
  return (await getStore()).settings;
}

export async function upsertProperty(property: Property): Promise<void> {
  const store = await getStoreForWrite();
  const idx = store.properties.findIndex((p) => p.slug === property.slug);
  if (idx >= 0) store.properties[idx] = property;
  else store.properties.unshift(property);
  await saveStore(store);
}

export async function deleteProperty(slug: string): Promise<void> {
  const store = await getStoreForWrite();
  store.properties = store.properties.filter((p) => p.slug !== slug);
  await saveStore(store);
}

export async function saveSettings(settings: SiteSettings): Promise<void> {
  const store = await getStoreForWrite();
  store.settings = settings;
  await saveStore(store);
}

/* ------------------------------- loteos -------------------------------- */

export async function getLoteos(): Promise<Loteo[]> {
  return (await getStore()).loteos;
}

export async function upsertLoteo(loteo: Loteo): Promise<void> {
  const store = await getStoreForWrite();
  const idx = store.loteos.findIndex((l) => l.slug === loteo.slug);
  if (idx >= 0) store.loteos[idx] = loteo;
  else store.loteos.unshift(loteo);
  await saveStore(store);
}

export async function deleteLoteo(slug: string): Promise<void> {
  const store = await getStoreForWrite();
  store.loteos = store.loteos.filter((l) => l.slug !== slug);
  await saveStore(store);
}
