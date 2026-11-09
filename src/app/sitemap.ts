import type { MetadataRoute } from "next";
import { getStore } from "@/lib/store";
import { publishedProperties } from "@/lib/properties";
import { SITE_URL } from "@/lib/site";

// Se regenera cada hora: suma solas las propiedades y loteos que se carguen.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { properties, loteos } = await getStore();

  const fixed: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/propiedades`, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/lotes`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/nosotras`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/contacto`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/privacidad`, changeFrequency: "yearly", priority: 0.2 },
  ];

  return [
    ...fixed,
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
