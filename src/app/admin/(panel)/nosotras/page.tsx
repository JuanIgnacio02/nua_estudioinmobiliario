import { getStore } from "@/lib/store";
import AboutEditor from "@/components/admin/AboutEditor";

export const dynamic = "force-dynamic";

export default async function AdminNosotras({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string }>;
}) {
  const { settings } = await getStore();
  const { ok } = await searchParams;

  return (
    <div className="mx-auto max-w-4xl px-5 py-10 md:px-10 md:py-14">
      <p className="text-eyebrow text-sage-500">Contenido</p>
      <h1 className="mt-2 font-display text-4xl text-ink">Sobre nosotras</h1>
      <p className="mt-2 text-ink-soft/70">
        Foto del equipo, presentación, pilares, misión, visión y valores.
      </p>

      {ok && (
        <p className="mt-6 rounded-xl bg-moss-600/10 px-4 py-3 text-sm text-moss-700">
          ✓ Cambios guardados.
        </p>
      )}

      <AboutEditor about={settings.about} />
    </div>
  );
}
