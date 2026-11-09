import { getStore } from "@/lib/store";
import { saveContactAction } from "@/app/admin/actions";
import AdminForm from "@/components/admin/AdminForm";
import { Field, Panel } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

export default async function AdminContacto() {
  const { settings } = await getStore();
  const c = settings.contact;

  return (
    <div className="admin-page mx-auto max-w-2xl px-5 py-10 md:px-10 md:py-14">
      <p className="text-eyebrow text-sage-600">Contenido</p>
      <h1 className="mt-2 font-display text-4xl text-ink">Datos de contacto</h1>
      <p className="mt-2 text-ink-soft/70">
        Se usan en el pie de página, en Contacto y en todos los botones de
        WhatsApp de la web.
      </p>

      <AdminForm action={saveContactAction} submitLabel="Guardar cambios" stayOnPage className="mt-8">
        <div className="space-y-4">
          <Panel title="Email" description="Donde llegan las consultas por correo.">
            <input
              name="email"
              type="email"
              required
              defaultValue={c.email}
              aria-label="Email"
              className="admin-input"
              autoComplete="off"
            />
          </Panel>

          <Panel
            title="Teléfono y WhatsApp"
            aside={
              c.phoneHref ? (
                <a
                  href={`https://wa.me/${c.phoneHref}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="glass-btn text-xs"
                >
                  Probar WhatsApp ↗
                </a>
              ) : null
            }
          >
            <div className="space-y-5">
              <Field label="Teléfono (como se muestra)" hint="Así lo lee la gente en la web.">
                <input
                  name="phone"
                  required
                  defaultValue={c.phone}
                  className="admin-input"
                  placeholder="+54 9 260 400 3217"
                  inputMode="tel"
                  autoComplete="off"
                />
              </Field>
              <Field
                label="Número de WhatsApp"
                hint="Solo números, con código de país y sin el 15. Ej: 5492604003217"
              >
                <input
                  name="phoneHref"
                  required
                  defaultValue={c.phoneHref}
                  className="admin-input font-mono tracking-wide"
                  placeholder="5492604003217"
                  inputMode="numeric"
                  pattern="[0-9 +\-]{10,20}"
                  title="Solo números, con código de país. Ej: 5492604003217"
                  autoComplete="off"
                />
              </Field>
            </div>
          </Panel>
        </div>
      </AdminForm>
    </div>
  );
}
