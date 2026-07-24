import Link from "next/link";
import PropertyForm from "@/components/admin/PropertyForm";

export default function NewProperty() {
  return (
    <div className="mx-auto max-w-5xl px-5 py-10 md:px-10 md:py-14">
      <Link
        href="/admin/propiedades"
        className="text-sm text-ink-soft/60 hover:text-moss-600"
      >
        ← Volver a propiedades
      </Link>
      <h1 className="mt-4 font-display text-4xl text-ink">Nueva propiedad</h1>
      <p className="mt-2 mb-10 text-ink-soft/70">
        Cargá los datos. La foto se comprime sola y la dirección se ubica en el
        mapa.
      </p>
      <PropertyForm />
    </div>
  );
}
