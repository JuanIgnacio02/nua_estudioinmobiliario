import type { MetadataRoute } from "next";
import { getStore } from "@/lib/store";
import { publishedProperties } from "@/lib/properties";
import { typePages, zonePages } from "@/lib/categories";
import { SITE_URL } from "@/lib/site";

// Se regenera cada hora: suma solas las propiedades y loteos que se carguen.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { properties, loteos } = await getStore();

  const fixed: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/propiedades`, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/lotes`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/tasaciones`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/nosotras`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/contacto`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/privacidad`, changeFrequency: "yearly", priority: 0.2 },
  ];

  return [
    ...fixed,
    // Páginas por tipo y por zona: solo las que tienen propiedades.
    ...typePages(properties).map((t) => ({
      url: `${SITE_URL}/propiedades/tipo/${t.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...zonePages(properties).map((z) => ({
      url: `${SITE_URL}/propiedades/zona/${z.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
    ...publishedProperties(properties).map((p) => ({
      url: `${SITE_URL}/propiedades/${p.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...loteos.map((l) => ({
      url: `${SITE_URL}/lotes/${l.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}
