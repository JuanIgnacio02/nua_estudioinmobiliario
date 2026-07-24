"use server";

import { promises as fs } from "fs";
import path from "path";
import sharp from "sharp";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  getStore,
  upsertProperty,
  deleteProperty,
  saveSettings,
} from "@/lib/store";
import { cloudinaryEnabled, uploadToCloudinary } from "@/lib/cloudinary";
import type {
  Property,
  Operation,
  PropertyType,
  SiteSettings,
} from "@/lib/properties";

const IMG_DIR = path.join(process.cwd(), "public", "images", "properties");

function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function revalidateAll() {
  revalidatePath("/", "layout");
}

/* -------------------------- image upload -------------------------- */

/**
 * Receives a File, compresses it to WebP (+ a sharpened 2x -lg variant for
 * heroes) and stores both under /public/images/properties. Returns the base
 * path. This is the local driver; on Vercel this swaps to Cloudinary.
 */
export async function uploadImageAction(
  formData: FormData
): Promise<{ ok: boolean; image?: string; error?: string }> {
  try {
    const file = formData.get("file") as File | null;
    if (!file || file.size === 0) return { ok: false, error: "Sin archivo" };
    if (!file.type.startsWith("image/"))
      return { ok: false, error: "El archivo no es una imagen" };

    const buf = Buffer.from(await file.arrayBuffer());
    const base = slugify(file.name.replace(/\.[^.]+$/, "")) || "propiedad";

    // Cloudinary path (production): compress to WebP and upload. Delivery does
    // auto format/quality; heroImage() applies the sharpened hero transform.
    if (cloudinaryEnabled()) {
      const optimized = await sharp(buf)
        .rotate()
        .resize({ width: 2600, height: 2600, fit: "inside", withoutEnlargement: true })
        .webp({ quality: 80, effort: 5 })
        .toBuffer();
      const url = await uploadToCloudinary(optimized, "nua/properties");
      if (url) return { ok: true, image: url };
    }

    // Local fallback (dev): write compressed + sharpened variants to /public.
    const name = `${base}-${Date.now()}`;
    await fs.mkdir(IMG_DIR, { recursive: true });
    const std = await sharp(buf)
      .rotate()
      .resize({ width: 1800, height: 1800, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 72, effort: 5 })
      .toBuffer();
    await fs.writeFile(path.join(IMG_DIR, `${name}.webp`), std);
    const meta = await sharp(buf).metadata();
    const targetW = Math.min((meta.width ?? 1600) * 2, 2600);
    const lg = await sharp(buf)
      .rotate()
      .resize({ width: targetW, kernel: "lanczos3" })
      .sharpen({ sigma: 1, m1: 0.6, m2: 2 })
      .webp({ quality: 82, effort: 5 })
      .toBuffer();
    await fs.writeFile(path.join(IMG_DIR, `${name}-lg.webp`), lg);
    return { ok: true, image: `/images/properties/${name}.webp` };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error al subir" };
  }
}

/* --------------------------- geocoding ---------------------------- */

/** Address → [lat, lng] using OpenStreetMap Nominatim (free, no key). */
export async function geocodeAction(
  address: string
): Promise<{ ok: boolean; coords?: [number, number]; label?: string; error?: string }> {
  try {
    const q = encodeURIComponent(`${address}, Mendoza, Argentina`);
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1&addressdetails=0`,
      {
        headers: {
          "User-Agent": "NUA-Estudio-Inmobiliario/1.0 (admin geocoder)",
          "Accept-Language": "es",
        },
        cache: "no-store",
      }
    );
    if (!res.ok) return { ok: false, error: "No se pudo geolocalizar" };
    const data = (await res.json()) as Array<{
      lat: string;
      lon: string;
      display_name: string;
    }>;
    if (!data.length)
      return { ok: false, error: "No encontramos esa dirección. Probá con más detalle." };
    return {
      ok: true,
      coords: [parseFloat(data[0].lat), parseFloat(data[0].lon)],
      label: data[0].display_name,
    };
  } catch {
    return { ok: false, error: "Error al geolocalizar" };
  }
}

/* ----------------------- property CRUD ---------------------------- */

function parseList(raw: FormDataEntryValue | null): string[] {
  if (!raw) return [];
  try {
    const arr = JSON.parse(String(raw));
    return Array.isArray(arr) ? arr.filter(Boolean).map(String) : [];
  } catch {
    return String(raw)
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
}

function num(raw: FormDataEntryValue | null): number | undefined {
  const n = parseFloat(String(raw ?? ""));
  return Number.isFinite(n) ? n : undefined;
}

/** Parse el contorno del lote: JSON con lista de vértices [lat, lng]. */
function parseBoundary(
  raw: FormDataEntryValue | null
): [number, number][] | undefined {
  if (!raw) return undefined;
  try {
    const arr = JSON.parse(String(raw));
    if (!Array.isArray(arr)) return undefined;
    const pts = arr
      .filter(
        (p): p is [number, number] =>
          Array.isArray(p) &&
          p.length === 2 &&
          Number.isFinite(p[0]) &&
          Number.isFinite(p[1])
      )
      .map(([a, b]) => [a, b] as [number, number]);
    return pts.length >= 3 ? pts : undefined;
  } catch {
    return undefined;
  }
}

export async function savePropertyAction(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return;

  const existingSlug = String(formData.get("slug") ?? "").trim();
  const store = await getStore();
  let slug = existingSlug || slugify(title);
  // Ensure uniqueness for new properties.
  if (!existingSlug) {
    let base = slug || "propiedad";
    let n = 1;
    while (store.properties.some((p) => p.slug === slug)) {
      slug = `${base}-${n++}`;
    }
  }

  const lat = num(formData.get("lat"));
  const lng = num(formData.get("lng"));

  const property: Property = {
    slug,
    title,
    operation: (String(formData.get("operation")) as Operation) || "venta",
    type: (String(formData.get("type")) as PropertyType) || "casa",
    price: num(formData.get("price")) ?? 0,
    currency: "USD",
    location: String(formData.get("location") ?? "").trim(),
    zone: String(formData.get("zone") ?? "").trim() || "San Rafael",
    city: String(formData.get("city") ?? "").trim() || "San Rafael",
    area: num(formData.get("area")) ?? 0,
    bedrooms: num(formData.get("bedrooms")),
    bathrooms: num(formData.get("bathrooms")),
    services: parseList(formData.get("services")),
    amenities: parseList(formData.get("amenities")),
    highlights: parseList(formData.get("highlights")),
    image: "",
    images: [],
    featured: formData.get("featured") === "on",
    description: String(formData.get("description") ?? "").trim(),
    coords:
      lat != null && lng != null ? [lat, lng] : undefined,
    boundary: parseBoundary(formData.get("boundary")),
  };

  // Gallery: first image is the main/cover. Keep `image` in sync for compat.
  const images = parseList(formData.get("images"));
  property.images = images;
  property.image = images[0] ?? "/images/properties/terreno-25demayo.webp";

  await upsertProperty(property);
  revalidateAll();
  redirect("/admin/propiedades");
}

export async function deletePropertyAction(formData: FormData) {
  const slug = String(formData.get("slug") ?? "");
  if (slug) {
    await deleteProperty(slug);
    revalidateAll();
  }
  redirect("/admin/propiedades");
}

/* ------------------------- site settings -------------------------- */

export async function saveContactAction(formData: FormData) {
  const store = await getStore();
  const settings: SiteSettings = {
    ...store.settings,
    contact: {
      email: String(formData.get("email") ?? "").trim(),
      phone: String(formData.get("phone") ?? "").trim(),
      phoneHref: String(formData.get("phoneHref") ?? "")
        .replace(/[^0-9]/g, "")
        .trim(),
    },
  };
  await saveSettings(settings);
  revalidateAll();
  redirect("/admin/contacto?ok=1");
}

export async function saveAboutAction(formData: FormData) {
  const store = await getStore();
  const settings: SiteSettings = {
    ...store.settings,
    about: {
      paragraphs: parseList(formData.get("paragraphs")),
      pillars: parseList(formData.get("pillars")),
      teamImage:
        String(formData.get("teamImage") ?? "").trim() ||
        store.settings.about.teamImage,
      mission: String(formData.get("mission") ?? "").trim(),
      vision: String(formData.get("vision") ?? "").trim(),
      values: String(formData.get("values") ?? "").trim(),
    },
  };
  await saveSettings(settings);
  revalidateAll();
  redirect("/admin/nosotras?ok=1");
}

/** Upload for non-property images (e.g. team photo, hero). */
export async function uploadGenericImageAction(
  formData: FormData
): Promise<{ ok: boolean; image?: string; error?: string }> {
  try {
    const file = formData.get("file") as File | null;
    if (!file || file.size === 0) return { ok: false, error: "Sin archivo" };
    const buf = Buffer.from(await file.arrayBuffer());
    const base = slugify(file.name.replace(/\.[^.]+$/, "")) || "imagen";
    const meta = await sharp(buf).metadata();
    const targetW = Math.min((meta.width ?? 1600) * 1.6, 2200);
    const out = await sharp(buf)
      .rotate()
      .resize({ width: Math.round(targetW), kernel: "lanczos3" })
      .sharpen({ sigma: 0.8, m1: 0.5, m2: 2 })
      .webp({ quality: 86, effort: 5 })
      .toBuffer();

    if (cloudinaryEnabled()) {
      const url = await uploadToCloudinary(out, "nua/site");
      if (url) return { ok: true, image: url };
    }

    const name = `${base}-${Date.now()}`;
    const dir = path.join(process.cwd(), "public", "images");
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, `${name}-lg.webp`), out);
    return { ok: true, image: `/images/${name}-lg.webp` };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error" };
  }
}
