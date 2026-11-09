import Link from "next/link";
import { notFound } from "next/navigation";
import { getStore } from "@/lib/store";
import { findLoteo } from "@/lib/loteos";
import LoteoForm from "@/components/admin/LoteoForm";

export const dynamic = "force-dynamic";

export default async function EditLoteo({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { loteos } = await getStore();
  const loteo = findLoteo(loteos, slug);
  if (!loteo) notFound();

  return (
    <div className="admin-page mx-auto max-w-5xl px-5 py-10 md:px-10 md:py-12">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/admin/loteos"
          className="inline-flex items-center gap-1.5 text-sm text-ink-soft/60 transition-colors hover:text-moss-700"
        >
          ← Loteos
        </Link>
        <Link href={`/lotes/${loteo.slug}`} target="_blank" className="glass-btn text-xs">
          Ver en la web ↗
        </Link>
      </div>
      <h1 className="mt-3 font-display text-4xl text-ink">Editar loteo</h1>
      <p className="mb-8 mt-2 text-ink-soft/70">{loteo.title}</p>
      <LoteoForm loteo={loteo} />
    </div>
  );
}
