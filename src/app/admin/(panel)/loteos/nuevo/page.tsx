import Link from "next/link";
import LoteoForm from "@/components/admin/LoteoForm";

export default function NewLoteo() {
  return (
    <div className="mx-auto max-w-5xl px-5 py-10 md:px-10 md:py-14">
      <Link
        href="/admin/loteos"
        className="text-sm text-ink-soft/60 hover:text-moss-600"
      >
        ← Volver a loteos
      </Link>
      <h1 className="mt-4 font-display text-4xl text-ink">Nuevo loteo</h1>
      <p className="mt-2 mb-10 text-ink-soft/70">
        Ubicá el desarrollo en el mapa y dibujá cada lote sobre la vista
        satelital. Los m² se calculan automáticamente.
      </p>
      <LoteoForm />
    </div>
  );
}
