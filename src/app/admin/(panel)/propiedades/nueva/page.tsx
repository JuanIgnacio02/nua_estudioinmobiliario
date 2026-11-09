import Link from "next/link";
import PropertyForm from "@/components/admin/PropertyForm";

export default function NewProperty() {
  return (
    <div className="admin-page mx-auto max-w-6xl px-5 py-10 md:px-10 md:py-12">
      <Link
        href="/admin/propiedades"
        className="inline-flex items-center gap-1.5 text-sm text-ink-soft/60 transition-colors hover:text-moss-700"
      >
        ← Propiedades
      </Link>
      <h1 className="mt-3 font-display text-4xl text-ink">Nueva propiedad</h1>
      <p className="mb-8 mt-2 text-ink-soft/70">
        Las fotos se comprimen solas y la dirección se ubica en el mapa.
      </p>
      <PropertyForm />
    </div>
  );
}
