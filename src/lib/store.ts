import "server-only";
import { promises as fs } from "fs";
import path from "path";
import {
  seedProperties,
  defaultSettings,
  type Property,
  type SiteSettings,
} from "./properties";

/**
 * Local file-backed store (dev / Node hosting). Isolated on purpose: to deploy
 * on Vercel/serverless, swap the read/write internals for Supabase without
 * touching the rest of the app. See memory: cloudinary-image-pipeline-plan.
 */

export type Store = {
  properties: Property[];
  settings: SiteSettings;
};

const DATA_DIR = path.join(process.cwd(), "data");
const STORE_PATH = path.join(DATA_DIR, "store.json");

async function ensureStore(): Promise<Store> {
  try {
    const raw = await fs.readFile(STORE_PATH, "utf8");
    const parsed = JSON.parse(raw) as Partial<Store>;
    return {
      properties: parsed.properties ?? seedProperties,
      settings: { ...defaultSettings, ...parsed.settings },
    };
  } catch {
    const seeded: Store = {
      properties: seedProperties,
      settings: defaultSettings,
    };
    // Try to persist the seed. On a read-only FS (Vercel serverless) this
    // fails silently and we serve the in-memory seed — the public site keeps
    // working. Real persistence there comes from the Supabase driver.
    try {
      await fs.mkdir(DATA_DIR, { recursive: true });
      await fs.writeFile(STORE_PATH, JSON.stringify(seeded, null, 2), "utf8");
    } catch {
      /* read-only filesystem — ignore */
    }
    return seeded;
  }
}

export async function getStore(): Promise<Store> {
  return ensureStore();
}

export async function saveStore(store: Store): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(STORE_PATH, JSON.stringify(store, null, 2), "utf8");
}

export async function getProperties(): Promise<Property[]> {
  return (await getStore()).properties;
}

export async function getSettings(): Promise<SiteSettings> {
  return (await getStore()).settings;
}

export async function upsertProperty(property: Property): Promise<void> {
  const store = await getStore();
  const idx = store.properties.findIndex((p) => p.slug === property.slug);
  if (idx >= 0) store.properties[idx] = property;
  else store.properties.unshift(property);
  await saveStore(store);
}

export async function deleteProperty(slug: string): Promise<void> {
  const store = await getStore();
  store.properties = store.properties.filter((p) => p.slug !== slug);
  await saveStore(store);
}

export async function saveSettings(settings: SiteSettings): Promise<void> {
  const store = await getStore();
  store.settings = settings;
  await saveStore(store);
}
