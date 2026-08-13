import Link from "next/link";
import { getStore } from "@/lib/store";
import PropertyBrowser from "@/components/admin/PropertyBrowser";

export const dynamic = "force-dynamic";

export default async function AdminProperties() {
  // El admin ve todo, incluidos los borradores.
  const { properties } = await getStore();
  const borradores = properties.filter((p) => p.draft).length;

  return (
    <div className="mx-auto max-w-5xl px-5 py-10 md:px-10 md:py-14">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-eyebrow text-sage-600">Contenido</p>
          <h1 className="mt-2 font-display text-4xl text-ink">Propiedades</h1>
          <p className="mt-2 text-ink-soft/70">
            {properties.length} en total
            {borradores > 0 && ` · ${borradores} en borrador`}
          </p>
        </div>
        <Link href="/admin/propiedades/nueva" className="glass-btn-primary">
          + Nueva propiedad
        </Link>
      </header>

      <PropertyBrowser properties={properties} />
    </div>
  );
}
