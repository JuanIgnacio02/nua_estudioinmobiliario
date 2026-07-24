export type Operation = "venta" | "alquiler";
export type PropertyType =
  | "casa"
  | "departamento"
  | "terreno"
  | "finca"
  | "cabanas";

export type Property = {
  slug: string;
  title: string;
  operation: Operation;
  type: PropertyType;
  price: number; // USD
  currency: "USD";
  location: string; // dirección legible
  zone: string; // barrio / localidad para filtro
  city: string;
  area: number; // m2
  bedrooms?: number;
  bathrooms?: number;
  services: string[];
  amenities?: string[];
  image: string; // portada (= images[0])
  images?: string[]; // galería completa; la primera es la principal
  featured: boolean;
  description: string;
  highlights?: string[];
  /** [lat, lng] — geolocalizadas desde la dirección. */
  coords?: [number, number];
};

/** Galería de una propiedad (retrocompatible con `image` único). */
export function propertyImages(p: Pick<Property, "image" | "images">): string[] {
  if (p.images && p.images.length) return p.images;
  return p.image ? [p.image] : [];
}

export type SiteSettings = {
  contact: { email: string; phone: string; phoneHref: string };
  about: {
    paragraphs: string[];
    pillars: string[];
    teamImage: string;
    mission: string;
    vision: string;
    values: string;
  };
};

export const TYPE_LABELS: Record<PropertyType, string> = {
  casa: "Casa",
  departamento: "Departamento",
  terreno: "Terreno / Lote",
  finca: "Finca",
  cabanas: "Complejo de cabañas",
};

export const OPERATION_LABELS: Record<Operation, string> = {
  venta: "Venta",
  alquiler: "Alquiler",
};

/** Seed data — used to initialise the store the first time. */
export const seedProperties: Property[] = [
  {
    slug: "terreno-25-de-mayo",
    title: "Terreno céntrico en venta · 300 m² sobre calle 25 de Mayo",
    operation: "venta",
    type: "terreno",
    price: 90000,
    currency: "USD",
    location: "25 de Mayo 172 — Ciudad",
    zone: "Ciudad",
    city: "San Rafael",
    area: 300,
    services: ["Luz", "Agua", "Gas"],
    image: "/images/properties/terreno-25demayo.webp",
    featured: true,
    description:
      "Excelente terreno de 300 m² sobre calle 25 de Mayo, en pleno centro de San Rafael. Una oportunidad única para desarrollar tu proyecto —vivienda o comercial— en una de las zonas más buscadas de la ciudad, con todos los servicios disponibles y a pasos de todo.",
    highlights: [
      "Ubicación céntrica premium",
      "Todos los servicios en el frente",
      "Apto vivienda o comercio",
    ],
    coords: [-34.6176, -68.3319],
  },
  {
    slug: "casa-fincas-del-diamante",
    title: "Casa en Fincas del Diamante · Diseño, naturaleza y calidad de vida",
    operation: "venta",
    type: "casa",
    price: 162500,
    currency: "USD",
    location: "Club de Campo Fincas del Diamante — Los Filtros 8.500",
    zone: "Fincas del Diamante",
    city: "San Rafael",
    area: 1303,
    bedrooms: 2,
    bathrooms: 2,
    services: ["Luz", "Agua"],
    amenities: ["Piscina", "Cancha de pádel y fútbol", "SUM", "Bar"],
    image: "/images/properties/casa-fincas-diamante.webp",
    featured: true,
    description:
      "Casa de diseño en el exclusivo Club de Campo Fincas del Diamante, donde la arquitectura se integra con la naturaleza. Amplios espacios, luz natural y una calidad de vida incomparable dentro de un entorno seguro con amenities de primer nivel.",
    highlights: [
      "Club de campo con seguridad 24hs",
      "Diseño integrado al paisaje",
      "Amenities de primer nivel",
    ],
    coords: [-34.655, -68.39],
  },
  {
    slug: "terreno-desarrollo-urbanistico",
    title: "Terreno con potencial de desarrollo urbanístico a 12 min del centro",
    operation: "venta",
    type: "terreno",
    price: 70000,
    currency: "USD",
    location: "Patricias Mendocinas 3111",
    zone: "Periurbano",
    city: "San Rafael",
    area: 50199,
    services: ["Luz", "Agua", "Pozo"],
    image: "/images/properties/terreno-urbanistico.webp",
    featured: true,
    description:
      "Gran extensión de más de 5 hectáreas con enorme potencial de desarrollo urbanístico, a solo 12 minutos del centro de San Rafael. Ideal para loteo, emprendimiento inmobiliario o proyecto productivo. Una inversión con proyección a futuro.",
    highlights: [
      "50.199 m² de superficie",
      "A 12 minutos del centro",
      "Potencial de loteo / desarrollo",
    ],
    coords: [-34.602, -68.355],
  },
  {
    slug: "casa-familiar-barrio-garbin",
    title: "Amplia casa familiar en Barrio Garbín · Comodidad y diseño",
    operation: "venta",
    type: "casa",
    price: 365000,
    currency: "USD",
    location: "Montecaseros 2280 — Barrio Garbín",
    zone: "Barrio Garbín",
    city: "San Rafael",
    area: 778,
    bedrooms: 4,
    bathrooms: 4,
    services: ["Luz", "Agua", "Gas"],
    amenities: ["Piscina"],
    image: "/images/properties/casa-garbin.webp",
    featured: true,
    description:
      "Amplia casa familiar en el consolidado Barrio Garbín, pensada para el confort de toda la familia. Cuatro dormitorios, cuatro baños, espacios generosos y una excelente ubicación que combina tranquilidad residencial con cercanía a servicios.",
    highlights: [
      "4 dormitorios y 4 baños",
      "Amplio lote de 778 m²",
      "Barrio residencial consolidado",
    ],
    coords: [-34.609, -68.341],
  },
  {
    slug: "chalet-barrio-sat",
    title: "Exclusivo chalet en Barrio SAT · Diseño, confort y calidad premium",
    operation: "venta",
    type: "casa",
    price: 590000,
    currency: "USD",
    location: "Libertad 1513 — Barrio SAT",
    zone: "Barrio SAT",
    city: "San Rafael",
    area: 298,
    bedrooms: 4,
    bathrooms: 3,
    services: ["Luz", "Agua", "Gas"],
    amenities: ["Piscina climatizada", "Calefacción centralizada"],
    image: "/images/properties/chalet-sat.webp",
    featured: true,
    description:
      "Exclusivo chalet en Barrio SAT que redefine el concepto de vivienda premium. Diseño arquitectónico de autor, terminaciones de máxima calidad, piscina climatizada y calefacción centralizada. Confort, privacidad y distinción en cada detalle.",
    highlights: [
      "Piscina climatizada",
      "Calefacción centralizada",
      "Terminaciones premium",
    ],
    coords: [-34.628, -68.338],
  },
  {
    slug: "departamento-amoblado-mendoza",
    title: "Departamento amoblado en excelente estado · Ciudad de Mendoza",
    operation: "venta",
    type: "departamento",
    price: 98000,
    currency: "USD",
    location: "José Federico Moreno 898, esq. Vicente López",
    zone: "Ciudad de Mendoza",
    city: "Mendoza",
    area: 110,
    bedrooms: 2,
    bathrooms: 2,
    services: ["Luz", "Agua", "Gas"],
    image: "/images/properties/depto-mendoza.webp",
    featured: false,
    description:
      "Departamento amoblado en excelente estado en plena Ciudad de Mendoza, sobre calle José Federico Moreno esquina Vicente López. Listo para habitar o rentar, con una ubicación inmejorable a metros de todo. Ideal como primera vivienda o inversión.",
    highlights: [
      "Totalmente amoblado",
      "Ubicación céntrica en Mendoza",
      "Listo para habitar o rentar",
    ],
    coords: [-32.8908, -68.8272],
  },
];

export const defaultSettings: SiteSettings = {
  contact: {
    email: "fq.nuaestudioinmobiliario@gmail.com",
    phone: "+54 9 260 400 3217",
    phoneHref: "5492604003217",
  },
  about: {
    paragraphs: [
      "Creemos que una propiedad no es solo una operación: es una decisión importante en la vida de una persona. Nacimos con la convicción de hacer las cosas de otra manera.",
      "Con compromiso real, escucha atenta y una mirada profesional que prioriza la confianza por sobre la urgencia. Estamos en San Rafael y trabajamos en toda Mendoza, conectando oportunidades con personas y construyendo relaciones que perduran.",
    ],
    pillars: ["Cercanía", "Energía", "Compromiso", "Acompañamiento"],
    teamImage: "/images/equipo-lg.webp",
    mission:
      "Brindar un servicio inmobiliario profesional y personalizado, basado en la confianza, la transparencia y el acompañamiento real en cada etapa del proceso. Trabajamos desde San Rafael hacia toda Mendoza, priorizando relaciones sólidas por sobre operaciones rápidas.",
    vision:
      "Consolidarnos como una marca inmobiliaria de referencia en Mendoza por nuestra forma de trabajar: cercana, consciente y estratégica. Aspiramos a crecer fortaleciendo vínculos duraderos y manteniendo una identidad clara, coherente y confiable.",
    values:
      "Confianza, transparencia, compromiso y acompañamiento. Energía puesta en cada proceso, entendiendo que detrás de cada decisión hay historias, proyectos y nuevos comienzos.",
  },
};

/* --------------------------- pure helpers --------------------------- */

/** High-resolution (sharpened) variant for full-bleed heroes. */
export function heroImage(p: Pick<Property, "image">) {
  // Cloudinary: inject a wide + sharpen transform right after /upload/.
  if (p.image.includes("res.cloudinary.com")) {
    return p.image.replace(
      "/upload/",
      "/upload/w_2600,c_limit,e_sharpen:60,f_auto,q_auto/"
    );
  }
  // Local files: use the pre-generated -lg variant.
  return p.image.replace(/\.webp$/i, "-lg.webp");
}

export function pickFeatured(list: Property[]) {
  const featured = list.filter((p) => p.featured);
  return featured.length > 0 ? featured : list.slice(0, 6);
}

export function getZones(list: Property[]) {
  return Array.from(new Set(list.map((p) => p.zone))).sort();
}

export function findProperty(list: Property[], slug: string) {
  return list.find((p) => p.slug === slug);
}

export function getRelated(list: Property[], slug: string, count = 3) {
  const current = findProperty(list, slug);
  return list
    .filter((p) => p.slug !== slug)
    .sort((a, b) => {
      const at = a.type === current?.type ? 0 : 1;
      const bt = b.type === current?.type ? 0 : 1;
      return at - bt || Number(b.featured) - Number(a.featured);
    })
    .slice(0, count);
}

export function formatPrice(p: Pick<Property, "price" | "currency">) {
  return `US$ ${p.price.toLocaleString("es-AR")}`;
}

export function formatArea(m2: number) {
  return `${m2.toLocaleString("es-AR")} m²`;
}
