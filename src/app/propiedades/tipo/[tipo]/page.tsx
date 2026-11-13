import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CategoryPage from "@/components/CategoryPage";
import { getStore } from "@/lib/store";
import { publishedProperties, type PropertyType } from "@/lib/properties";
import { TYPE_PAGES, sortForListing, typeFromSlug, typePages } from "@/lib/categories";

export const revalidate = 300;

export function generateStaticParams() {
  return (Object.keys(TYPE_PAGES) as PropertyType[]).map((t) => ({ tipo: TYPE_PAGES[t].slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tipo: string }>;
}): Promise<Metadata> {
  const { tipo } = await params;
  const type = typeFromSlug(tipo);
  if (!type) return {};
  const t = TYPE_PAGES[type];
  return {
    title: `${t.title} en San Rafael y Mendoza`,
    description: t.intro,
    alternates: { canonical: `/propiedades/tipo/${t.slug}` },
  };
}

export default async function TipoPage({ params }: { params: Promise<{ tipo: string }> }) {
  const { tipo } = await params;
  const type = typeFromSlug(tipo);
  if (!type) notFound();
  const t = TYPE_PAGES[type];

  const { properties: all, settings } = await getStore();
  const list = sortForListing(publishedProperties(all).filter((p) => p.type === type));

  return (
    <CategoryPage
      settings={settings}
      eyebrow={t.title}
      title={`${t.title} en San Rafael y Mendoza`}
      intro={t.intro}
      path={`/propiedades/tipo/${t.slug}`}
      properties={list}
      explorerHref={`/propiedades?tipo=${type}`}
      emptyText={`En este momento no hay ${t.noun} ${t.fem ? "publicadas" : "publicados"}, pero nos llegan ${t.fem ? "nuevas" : "nuevos"} seguido. Contanos qué buscás y te avisamos.`}
      related={typePages(all)
        .filter((x) => x.type !== type)
        .map((x) => ({ label: x.title, href: `/propiedades/tipo/${x.slug}`, count: x.count }))}
    />
  );
}
