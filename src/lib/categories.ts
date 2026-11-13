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
  /** `fem`: para concordar "publicadas/publicados" con el sustantivo. */
  { slug: string; title: string; noun: string; fem: boolean; intro: string }
> = {
  casa: {
    slug: "casas",
    title: "Casas",
    noun: "casas",
    fem: true,
    intro:
      "Casas en venta y alquiler en San Rafael y Mendoza: desde opciones para la primera vivienda hasta casas de diseño con parque y pileta.",
  },
  chalet: {
    slug: "chalets",
    title: "Chalets",
    noun: "chalets",
    fem: false,
    intro:
      "Chalets en San Rafael y Mendoza: casas de una o dos plantas con jardín, pensadas para vivir con espacio y comodidad.",
  },
  "casa-quinta": {
    slug: "casas-quinta",
    title: "Casas quinta",
    noun: "casas quinta",
    fem: true,
    intro:
      "Casas quinta con parque, para vivir rodeado de verde o disfrutar los fines de semana cerca de la ciudad.",
  },
  departamento: {
    slug: "departamentos",
    title: "Departamentos",
    noun: "departamentos",
    fem: false,
    intro:
      "Departamentos para vivir o invertir, en zonas céntricas y con buena conectividad.",
  },
  monoambiente: {
    slug: "monoambientes",
    title: "Monoambientes",
    noun: "monoambientes",
    fem: false,
    intro:
      "Monoambientes prácticos para vivir, estudiar o invertir y poner en renta.",
  },
  ph: {
    slug: "ph",
    title: "PH",
    noun: "PH",
    fem: false,
    intro:
      "PH (propiedad horizontal): la independencia de una casa con la practicidad de un departamento.",
  },
  cabana: {
    slug: "cabanas",
    title: "Cabañas",
    noun: "cabañas",
    fem: true,
    intro:
      "Cabañas para vivir, descansar o alquilar a turistas en uno de los destinos más elegidos de Mendoza.",
  },
  terreno: {
    slug: "terrenos",
    title: "Terrenos y lotes",
    noun: "terrenos y lotes",
    fem: false,
    intro:
      "Terrenos y lotes para construir tu casa o desarrollar un proyecto, con su ubicación en el mapa y sus medidas.",
  },
  finca: {
    slug: "fincas",
    title: "Fincas",
    noun: "fincas",
    fem: true,
    intro:
      "Fincas y propiedades rurales en el sur mendocino, para producir, invertir o vivir rodeado de naturaleza.",
  },
  campo: {
    slug: "campos",
    title: "Campos",
    noun: "campos",
    fem: false,
    intro:
      "Campos y grandes extensiones en el sur mendocino, para producción agrícola o ganadera, o como inversión.",
  },
  local: {
    slug: "locales-comerciales",
    title: "Locales comerciales",
    noun: "locales comerciales",
    fem: false,
    intro:
      "Locales comerciales para abrir tu negocio o invertir en renta, en zonas de paso de San Rafael y Mendoza.",
  },
  oficina: {
    slug: "oficinas",
    title: "Oficinas",
    noun: "oficinas",
    fem: true,
    intro:
      "Oficinas para profesionales y empresas, en ubicaciones cómodas y bien conectadas.",
  },
  galpon: {
    slug: "galpones",
    title: "Galpones",
    noun: "galpones",
    fem: false,
    intro:
      "Galpones y depósitos para industria, logística o almacenamiento.",
  },
  cochera: {
    slug: "cocheras",
    title: "Cocheras",
    noun: "cocheras",
    fem: true,
    intro:
      "Cocheras para guardar tu auto o invertir con poco capital.",
  },
  cabanas: {
    slug: "complejos-de-cabanas",
    title: "Complejos de cabañas",
    noun: "complejos de cabañas",
    fem: false,
    intro:
      "Complejos de cabañas en funcionamiento o para poner en marcha, en uno de los destinos turísticos más elegidos de Mendoza.",
  },
  hotel: {
    slug: "hoteles",
    title: "Hoteles",
    noun: "hoteles",
    fem: false,
    intro:
      "Hoteles y alojamientos en funcionamiento, en una de las zonas turísticas más elegidas de Mendoza.",
  },
  "fondo-de-comercio": {
    slug: "fondos-de-comercio",
    title: "Fondos de comercio",
    noun: "fondos de comercio",
    fem: false,
    intro:
      "Fondos de comercio en marcha: el negocio con sus instalaciones, su nombre y su clientela, listo para seguir funcionando.",
  },
  "llave-de-negocio": {
    slug: "llaves-de-negocio",
    title: "Llaves de negocio",
    noun: "llaves de negocio",
    fem: true,
    intro:
      "Llaves de negocio: tomá un local ya instalado y con clientela, sin empezar de cero.",
  },
  "negocio-especial": {
    slug: "negocios-especiales",
    title: "Negocios especiales",
    noun: "negocios especiales",
    fem: false,
    intro:
      "Oportunidades que no entran en una sola categoría: emprendimientos, propiedades con renta y negocios a medida.",
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
