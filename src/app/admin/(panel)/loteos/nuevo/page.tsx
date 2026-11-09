import Link from "next/link";
import LoteoForm from "@/components/admin/LoteoForm";

export default function NewLoteo() {
  return (
    <div className="admin-page mx-auto max-w-5xl px-5 py-10 md:px-10 md:py-12">
      <Link
        href="/admin/loteos"
        className="inline-flex items-center gap-1.5 text-sm text-ink-soft/60 transition-colors hover:text-moss-700"
      >
        ← Loteos
      </Link>
      <h1 className="mt-3 font-display text-4xl text-ink">Nuevo loteo</h1>
      <p className="mb-8 mt-2 text-ink-soft/70">
        Ubicá el desarrollo en el mapa y dibujá cada lote sobre la vista
        satelital. Los m² se calculan automáticamente.
      </p>
      <LoteoForm />
    </div>
  );
}
