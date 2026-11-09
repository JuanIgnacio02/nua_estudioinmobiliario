import {
  publishedProperties,
  saleRank,
  type Property,
  type PropertyType,
} from "./properties";

/*
 * Páginas por tipo y por zona ("Terrenos en San Rafael", "Propiedades en
 * Barrio SAT"). Son las búsquedas que hace la gente en Google: cada una tiene
 * su URL, su título y su texto, y se arman solas con lo que se carga.
 */

export const TYPE_PAGES: Record<
  PropertyType,
  { slug: string; title: string; noun: string; intro: string }
> = {
  casa: {
    slug: "casas",
    title: "Casas",
    noun: "casas",
    intro:
      "Casas en venta y alquiler en San Rafael y Mendoza: desde opciones para la primera vivienda hasta casas de diseño con parque y pileta.",
  },
  departamento: {
    slug: "departamentos",
    title: "Departamentos",
    noun: "departamentos",
    intro:
      "Departamentos para vivir o invertir, en zonas céntricas y con buena conectividad.",
  },
  terreno: {
    slug: "terrenos",
    title: "Terrenos y lotes",
    noun: "terrenos y lotes",
    intro:
      "Terrenos y lotes para construir tu casa o desarrollar un proyecto, con su ubicación en el mapa y sus medidas.",
  },
  finca: {
    slug: "fincas",
    title: "Fincas",
    noun: "fincas",
    intro:
      "Fincas y propiedades rurales en el sur mendocino, para producir, invertir o vivir rodeado de naturaleza.",
  },
  cabanas: {
    slug: "complejos-de-cabanas",
    title: "Complejos de cabañas",
    noun: "complejos de cabañas",
    intro:
      "Complejos de cabañas en funcionamiento o para poner en marcha, en uno de los destinos turísticos más elegidos de Mendoza.",
  },
};

export function typeFromSlug(slug: string): PropertyType | null {
  const hit = (Object.keys(TYPE_PAGES) as PropertyType[]).find(
    (t) => TYPE_PAGES[t].slug === slug
  );
  return hit ?? null;
}

export function zoneSlug(zone: string) {
  return zone
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Zonas con al menos una propiedad publicada, con su slug y cantidad. */
export function zonePages(all: Property[]) {
  const map = new Map<string, { zone: string; slug: string; count: number }>();
  for (const p of publishedProperties(all)) {
    if (!p.zone) continue;
    const slug = zoneSlug(p.zone);
    if (!slug) continue;
    const cur = map.get(slug) ?? { zone: p.zone, slug, count: 0 };
    cur.count++;
    map.set(slug, cur);
  }
  return [...map.values()].sort((a, b) => b.count - a.count || a.zone.localeCompare(b.zone));
}

/** Tipos con al menos una propiedad publicada. */
export function typePages(all: Property[]) {
  const pub = publishedProperties(all);
  return (Object.keys(TYPE_PAGES) as PropertyType[])
    .map((t) => ({ type: t, ...TYPE_PAGES[t], count: pub.filter((p) => p.type === t).length }))
    .filter((t) => t.count > 0);
}

/** Disponibles primero, vendidas al final; dentro, destacadas y precio. */
export function sortForListing(list: Property[]) {
  return [...list].sort(
    (a, b) =>
      saleRank(a) - saleRank(b) ||
      Number(b.featured) - Number(a.featured) ||
      b.price - a.price
  );
}
