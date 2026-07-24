import Link from "next/link";
import { notFound } from "next/navigation";
import { getStore } from "@/lib/store";
import { findProperty } from "@/lib/properties";
import PropertyForm from "@/components/admin/PropertyForm";

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
    <div className="mx-auto max-w-5xl px-5 py-10 md:px-10 md:py-14">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link
          href="/admin/propiedades"
          className="text-sm text-ink-soft/60 hover:text-moss-600"
        >
          ← Volver a propiedades
        </Link>
        <Link
          href={`/propiedades/${property.slug}`}
          target="_blank"
          className="text-sm text-moss-600 hover:underline"
        >
          Ver en el sitio ↗
        </Link>
      </div>
      <h1 className="mt-4 font-display text-4xl text-ink">Editar propiedad</h1>
      <p className="mt-2 mb-10 text-ink-soft/70">{property.title}</p>
      <PropertyForm property={property} />
    </div>
  );
}
