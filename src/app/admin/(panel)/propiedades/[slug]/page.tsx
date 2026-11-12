import Link from "next/link";
import { notFound } from "next/navigation";
import { getStore } from "@/lib/store";
import { findProperty, propertyImages } from "@/lib/properties";
import PropertyForm from "@/components/admin/PropertyForm";
import DuplicateButton from "@/components/admin/DuplicateButton";
import SocialKitButton from "@/components/admin/SocialKit";

export const dynamic = "force-dynamic";

export default async function EditProperty({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { properties } = await getStore();
  const property = findProperty(properties, slug);
  if (!property) notFound();

  return (
    <div className="admin-page mx-auto max-w-6xl px-5 py-10 md:px-10 md:py-12">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/admin/propiedades"
          className="inline-flex items-center gap-1.5 text-sm text-ink-soft/60 transition-colors hover:text-moss-700"
        >
          ← Propiedades
        </Link>
        <div className="flex flex-wrap gap-2">
          <SocialKitButton
            slug={property.slug}
            title={property.title}
            images={propertyImages(property)}
            draft={Boolean(property.draft)}
          />
          <DuplicateButton slug={property.slug} title={property.title} variant="button" />
          {!property.draft && (
            <Link
              href={`/propiedades/${property.slug}`}
              target="_blank"
              className="glass-btn text-xs"
            >
              Ver en la web ↗
            </Link>
          )}
        </div>
      </div>
      <h1 className="mt-3 font-display text-4xl text-ink">Editar propiedad</h1>
      <p className="mb-8 mt-2 line-clamp-2 text-ink-soft/70">{property.title}</p>
      <PropertyForm property={property} />
    </div>
  );
}
