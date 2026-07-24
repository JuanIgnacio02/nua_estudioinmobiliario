import { getStore } from "@/lib/store";
import { saveContactAction } from "@/app/admin/actions";

export const dynamic = "force-dynamic";

export default async function AdminContacto({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string }>;
}) {
  const { settings } = await getStore();
  const { ok } = await searchParams;
  const c = settings.contact;

  return (
    <div className="mx-auto max-w-2xl px-5 py-10 md:px-10 md:py-14">
      <p className="text-eyebrow text-sage-500">Contenido</p>
      <h1 className="mt-2 font-display text-4xl text-ink">Datos de contacto</h1>
      <p className="mt-2 text-ink-soft/70">
        Se usan en el footer, la página de contacto y los botones de WhatsApp.
      </p>

      {ok && (
        <p className="mt-6 rounded-xl bg-moss-600/10 px-4 py-3 text-sm text-moss-700">
          ✓ Cambios guardados.
        </p>
      )}

      <form action={saveContactAction} className="mt-8 space-y-6">
        <label className="block">
          <span className="text-eyebrow text-sage-500">Email</span>
          <input
            name="email"
            type="email"
            required
            defaultValue={c.email}
            className="admin-input mt-2"
          />
        </label>
        <label className="block">
          <span className="text-eyebrow text-sage-500">
            Teléfono (como se muestra)
          </span>
          <input
            name="phone"
            required
            defaultValue={c.phone}
            className="admin-input mt-2"
            placeholder="+54 9 260 400 3217"
          />
        </label>
        <label className="block">
          <span className="text-eyebrow text-sage-500">
            WhatsApp (solo números, con código de país)
          </span>
          <input
            name="phoneHref"
            required
            defaultValue={c.phoneHref}
            className="admin-input mt-2"
            placeholder="5492604003217"
          />
          <span className="mt-1 block text-xs text-ink-soft/50">
            Sin +, espacios ni guiones. Ej: 5492604003217
          </span>
        </label>
        <button
          type="submit"
          className="rounded-full bg-moss-600 px-8 py-3.5 text-sm font-medium text-mint-100 transition-colors hover:bg-moss-700"
        >
          Guardar cambios
        </button>
      </form>
    </div>
  );
}
