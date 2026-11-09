import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getStore } from "@/lib/store";

/**
 * 404 propia (antes salía la de Next, en inglés). En una inmobiliaria lo más
 * común es entrar desde un link viejo a una propiedad que ya se vendió, así
 * que el mensaje y los botones apuntan a eso.
 */
export default async function NotFound() {
  const { settings } = await getStore();
  const { contact } = settings;

  return (
    <>
      <Navbar contact={contact} />
      <main className="flex min-h-[80vh] items-center bg-bone px-5 pb-20 pt-32 md:px-10">
        <div className="mx-auto w-full max-w-3xl text-center">
          <p className="text-eyebrow text-sage-500">Error 404</p>
          <h1 className="mt-6 font-display text-[clamp(2.5rem,7vw,5rem)] leading-[0.95] text-ink">
            Esta página no existe
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-ink-soft/75">
            Puede que la propiedad ya se haya vendido o que el enlace tenga un
            error. Te ayudamos a encontrar lo que buscás.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/propiedades"
              className="inline-flex min-h-11 items-center gap-3 rounded-full bg-moss-600 px-7 py-3.5 text-sm font-medium text-mint-100 transition-colors hover:bg-moss-700"
            >
              Ver propiedades disponibles →
            </Link>
            <Link
              href="/"
              className="inline-flex min-h-11 items-center rounded-full border border-moss-600/20 px-7 py-3.5 text-sm text-moss-600 transition-colors hover:bg-mint-100"
            >
              Volver al inicio
            </Link>
          </div>
          <p className="mt-10 text-sm text-ink-soft/60">
            ¿Buscabas algo en particular?{" "}
            <a
              href={`https://wa.me/${contact.phoneHref}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-moss-600 underline underline-offset-4 hover:text-moss-700"
            >
              Escribinos por WhatsApp
            </a>
          </p>
        </div>
      </main>
      <Footer contact={contact} />
    </>
  );
}
