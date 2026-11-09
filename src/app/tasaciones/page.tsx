import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AnimatedHeading from "@/components/anim/AnimatedHeading";
import AppraisalForm from "@/components/AppraisalForm";
import JsonLd from "@/components/JsonLd";
import { breadcrumbJsonLd } from "@/lib/seo";
import { getStore } from "@/lib/store";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Tasaciones",
  description:
    "Pedí la tasación de tu casa, terreno, departamento o finca en San Rafael y toda Mendoza. Valor real de mercado, sin compromiso, con el acompañamiento de NÚA.",
  alternates: { canonical: "/tasaciones" },
};

const STEPS = [
  {
    n: "01",
    t: "Nos contás",
    d: "Completás el formulario o nos escribís por WhatsApp con los datos básicos de la propiedad.",
  },
  {
    n: "02",
    t: "La visitamos",
    d: "Coordinamos una visita y relevamos el estado, la documentación y el entorno.",
  },
  {
    n: "03",
    t: "Te damos un valor real",
    d: "Comparamos con operaciones recientes de la zona y te explicamos el porqué del precio.",
  },
];

const REASONS = [
  "Sin compromiso: vos decidís si después la publicamos.",
  "Conocemos cada barrio de San Rafael y alrededores.",
  "Un precio bien puesto vende antes y sin rebajas.",
  "Te acompañamos en papeles, visitas y escritura.",
];

export default async function TasacionesPage() {
  const { settings } = await getStore();

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Inicio", path: "/" },
          { name: "Tasaciones", path: "/tasaciones" },
        ])}
      />
      <Navbar contact={settings.contact} />
      <main>
        <header className="bg-celadon-400 px-5 pb-16 pt-36 text-moss-900 md:px-10 md:pb-24 md:pt-48">
          <div className="mx-auto max-w-[1600px]">
            <p className="text-eyebrow mb-6 flex items-center gap-3 text-moss-700">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-moss-700" />
              Tasaciones · Vendé con nosotras
            </p>
            <AnimatedHeading
              as="h1"
              immediate
              text="¿Cuánto vale tu propiedad?"
              className="text-display max-w-[14ch] font-display text-moss-900"
            />
            <p className="mt-8 max-w-xl text-lg text-moss-900/70">
              Te damos un valor de mercado real, explicado y sin compromiso. Si
              decidís vender, te acompañamos en todo el camino.
            </p>
          </div>
        </header>

        <section className="bg-bone px-5 py-16 md:px-10 md:py-24">
          <div className="mx-auto grid max-w-[1600px] gap-14 lg:grid-cols-[1fr_1.1fr] lg:gap-20">
            {/* Cómo funciona */}
            <div>
              <p className="text-eyebrow mb-8 text-sage-500">Cómo funciona</p>
              <ol className="space-y-8">
                {STEPS.map((s) => (
                  <li key={s.n} className="flex gap-6 border-b border-moss-600/10 pb-8">
                    <span className="font-display text-2xl text-sage-400">{s.n}</span>
                    <div>
                      <h2 className="font-display text-2xl leading-tight text-ink md:text-3xl">
                        {s.t}
                      </h2>
                      <p className="mt-2 max-w-md text-ink-soft/75">{s.d}</p>
                    </div>
                  </li>
                ))}
              </ol>

              <ul className="mt-10 grid gap-3 sm:grid-cols-2">
                {REASONS.map((r) => (
                  <li key={r} className="flex items-start gap-3 text-sm text-ink-soft">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-mint-100 text-moss-600">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                    </span>
                    {r}
                  </li>
                ))}
              </ul>
            </div>

            {/* Formulario */}
            <div className="rounded-3xl border border-moss-600/10 bg-mint-50/50 p-6 md:p-10 lg:sticky lg:top-28 lg:self-start">
              <p className="text-eyebrow text-sage-500">Pedí tu tasación</p>
              <p className="mt-3 font-display text-3xl text-ink">Contanos de tu propiedad</p>
              <p className="mt-2 text-sm text-ink-soft/70">
                Se abre WhatsApp con tus datos listos para enviar. Te
                respondemos a la brevedad.
              </p>
              <AppraisalForm phoneHref={settings.contact.phoneHref} />
            </div>
          </div>
        </section>
      </main>
      <Footer contact={settings.contact} />
    </>
  );
}
