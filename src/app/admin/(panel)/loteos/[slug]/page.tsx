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
    <div className="mx-auto max-w-5xl px-5 py-10 md:px-10 md:py-14">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link
          href="/admin/loteos"
          className="text-sm text-ink-soft/60 hover:text-moss-600"
        >
          ← Volver a loteos
        </Link>
        <Link
          href={`/lotes/${loteo.slug}`}
          target="_blank"
          className="text-sm text-moss-600 hover:underline"
        >
          Ver en el sitio ↗
        </Link>
      </div>
      <h1 className="mt-4 font-display text-4xl text-ink">Editar loteo</h1>
      <p className="mt-2 mb-10 text-ink-soft/70">{loteo.title}</p>
      <LoteoForm loteo={loteo} />
    </div>
  );
}
