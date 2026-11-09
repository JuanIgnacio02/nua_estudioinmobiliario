import { SITE_URL } from "./site";
import {
  propertyImages,
  saleStatus,
  type Property,
  type PropertyType,
  type SiteSettings,
} from "./properties";

/** URL absoluta (las fotos locales vienen como "/images/..."). */
const abs = (src: string) => (/^https?:\/\//.test(src) ? src : `${SITE_URL}${src}`);

/** La inmobiliaria: ayuda a aparecer en búsquedas locales ("inmobiliaria San Rafael"). */
export function agencyJsonLd(contact: SiteSettings["contact"]) {
  return {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    name: "NÚA Estudio Inmobiliario",
    url: SITE_URL,
    logo: `${SITE_URL}/apple-icon.png`,
    image: `${SITE_URL}/opengraph-image`,
    description:
      "Asesoramiento inmobiliario profesional y personalizado en San Rafael y toda Mendoza: compra, venta, tasaciones y alquileres.",
    email: contact.email,
    telephone: contact.phone,
    address: {
      "@type": "PostalAddress",
      addressLocality: "San Rafael",
      addressRegion: "Mendoza",
      addressCountry: "AR",
    },
    areaServed: [
      { "@type": "City", name: "San Rafael" },
      { "@type": "State", name: "Mendoza" },
    ],
  };
}

const SCHEMA_TYPE: Record<PropertyType, string> = {
  casa: "SingleFamilyResidence",
  departamento: "Apartment",
  terreno: "Place",
  finca: "Place",
  cabanas: "Accommodation",
};

const AVAILABILITY = {
  disponible: "https://schema.org/InStock",
  reservada: "https://schema.org/LimitedAvailability",
  vendida: "https://schema.org/SoldOut",
} as const;

/** Una propiedad: precio, disponibilidad, superficie y ubicación. */
export function listingJsonLd(p: Property) {
  const url = `${SITE_URL}/propiedades/${p.slug}`;
  return {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: p.title,
    description: p.description,
    url,
    image: propertyImages(p).map(abs),
    offers: {
      "@type": "Offer",
      ...(p.price > 0 ? { price: p.price, priceCurrency: "USD" } : {}),
      availability: AVAILABILITY[saleStatus(p)],
      businessFunction:
        p.operation === "alquiler"
          ? "http://purl.org/goodrelations/v1#LeaseOut"
          : "http://purl.org/goodrelations/v1#Sell",
      url,
    },
    about: {
      "@type": SCHEMA_TYPE[p.type],
      name: p.title,
      address: {
        "@type": "PostalAddress",
        streetAddress: p.location,
        addressLocality: p.city,
        addressRegion: "Mendoza",
        addressCountry: "AR",
      },
      ...(p.coords
        ? { geo: { "@type": "GeoCoordinates", latitude: p.coords[0], longitude: p.coords[1] } }
        : {}),
      ...(p.area > 0
        ? { floorSize: { "@type": "QuantitativeValue", value: p.coveredArea ?? p.area, unitCode: "MTK" } }
        : {}),
      ...(p.bedrooms != null ? { numberOfBedrooms: p.bedrooms } : {}),
      ...(p.bathrooms != null ? { numberOfBathroomsTotal: p.bathrooms } : {}),
    },
  };
}

/** Migas de pan: Google las muestra en lugar de la URL en los resultados. */
export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: `${SITE_URL}${it.path}`,
    })),
  };
}
