import Link from "next/link";
import Logo from "./Logo";
import { defaultSettings, type SiteSettings } from "@/lib/properties";

export default function Footer({
  contact = defaultSettings.contact,
}: {
  contact?: SiteSettings["contact"];
}) {
  const CONTACT = contact;
  return (
    <footer className="relative overflow-hidden bg-celadon-400 text-moss-900">
      {/* Oversized wordmark backdrop */}
      <div className="pointer-events-none absolute -bottom-[8%] left-1/2 w-[120%] -translate-x-1/2 text-moss-900/10">
        <Logo className="h-auto w-full" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 pt-24 pb-10 md:px-10">
        <div className="grid gap-14 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div className="max-w-xs">
            <p className="font-display text-3xl leading-tight text-moss-900">
              Construimos confianza.
              <br />
              Desarrollamos futuro.
            </p>
            <p className="mt-6 text-sm text-moss-700/80">
              Estudio inmobiliario en San Rafael, trabajando en toda Mendoza.
            </p>
          </div>

          <FooterCol
            title="Propiedades"
            items={[
              ["Casas", "/propiedades?type=casa"],
              ["Departamentos", "/propiedades?type=departamento"],
              ["Terrenos / Lotes", "/propiedades?type=terreno"],
              ["Fincas", "/propiedades?type=finca"],
              ["Complejo de cabañas", "/propiedades?type=cabanas"],
            ]}
          />
          <FooterCol
            title="Servicios"
            items={[
              ["Compra / Venta", "/contacto"],
              ["Tasaciones", "/contacto"],
              ["Asesoramiento", "/contacto"],
              ["Alquileres / Administración", "/contacto"],
              ["Sobre nosotras", "/nosotras"],
            ]}
          />

          <div>
            <h4 className="text-eyebrow text-moss-700">Contacto</h4>
            <ul className="mt-5 space-y-3 text-sm">
              <li>
                <a
                  href={`mailto:${CONTACT.email}`}
                  className="break-all text-moss-900/80 transition-colors hover:text-moss-900"
                >
                  {CONTACT.email}
                </a>
              </li>
              <li>
                <a
                  href={`https://wa.me/${CONTACT.phoneHref}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-moss-900/80 transition-colors hover:text-moss-900"
                >
                  {CONTACT.phone}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-20 flex flex-col gap-4 border-t border-moss-900/10 pt-8 text-xs text-moss-700/70 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <Logo className="h-4 w-auto text-moss-700" />
            <span>
              © {new Date().getFullYear()} NÚA Estudio Inmobiliario. Todos los
              derechos reservados.
            </span>
          </div>
          <div className="flex gap-6">
            <Link href="/#" className="transition-colors hover:text-moss-900">
              Política de privacidad
            </Link>
            <Link href="/#" className="transition-colors hover:text-moss-900">
              Términos de servicio
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({
  title,
  items,
}: {
  title: string;
  items: [string, string][];
}) {
  return (
    <div>
      <h4 className="text-eyebrow text-moss-700">{title}</h4>
      <ul className="mt-5 space-y-3 text-sm">
        {items.map(([label, href]) => (
          <li key={label}>
            <Link
              href={href}
              className="text-moss-900/70 transition-colors hover:text-moss-900"
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
