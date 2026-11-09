import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CategoryPage from "@/components/CategoryPage";
import { getStore } from "@/lib/store";
import { publishedProperties } from "@/lib/properties";
import { sortForListing, zonePages, zoneSlug } from "@/lib/categories";

export const revalidate = 300;

export async function generateStaticParams() {
  const { properties } = await getStore();
  return zonePages(properties).map((z) => ({ zona: z.slug }));
}

async function load(zona: string) {
  const { properties: all, settings } = await getStore();
  const zones = zonePages(all);
  const zone = zones.find((z) => z.slug === zona);
  return { all, settings, zones, zone };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ zona: string }>;
}): Promise<Metadata> {
  const { zona } = await params;
  const { zone } = await load(zona);
  if (!zone) return {};
  return {
    title: `Propiedades en ${zone.zone}`,
    description: `Casas, terrenos y más propiedades en venta y alquiler en ${zone.zone}. Fotos, precios, ubicación en el mapa y contacto directo con NÚA Estudio Inmobiliario.`,
    alternates: { canonical: `/propiedades/zona/${zone.slug}` },
  };
}

export default async function ZonaPage({ params }: { params: Promise<{ zona: string }> }) {
  const { zona } = await params;
  const { all, settings, zones, zone } = await load(zona);
  if (!zone) notFound();

  const list = sortForListing(
    publishedProperties(all).filter((p) => zoneSlug(p.zone) === zone.slug)
  );

  return (
    <CategoryPage
      settings={settings}
      eyebrow={zone.zone}
      title={`Propiedades en ${zone.zone}`}
      intro={`Todo lo que tenemos publicado en ${zone.zone}: fotos, precios, ubicación en el mapa y contacto directo por WhatsApp.`}
      path={`/propiedades/zona/${zone.slug}`}
      properties={list}
      explorerHref={`/propiedades?zona=${encodeURIComponent(zone.zone)}`}
      emptyText="En este momento no hay propiedades publicadas en esta zona."
      related={zones
        .filter((z) => z.slug !== zone.slug)
        .map((z) => ({ label: z.zone, href: `/propiedades/zona/${z.slug}`, count: z.count }))}
    />
  );
}
