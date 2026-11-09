import Link from "next/link";

/** Invitación a vender: lleva a /tasaciones. */
export default function SellBand() {
  return (
    <section className="bg-bone px-5 pb-8 md:px-10">
      <div className="mx-auto grid max-w-[1600px] items-center gap-8 rounded-[2rem] border border-moss-600/10 bg-mint-50/60 px-8 py-12 md:grid-cols-[1.4fr_1fr] md:px-14 md:py-16">
        <div>
          <p className="text-eyebrow mb-5 text-sage-500">¿Querés vender?</p>
          <h2 className="max-w-[20ch] font-display text-4xl leading-[1.05] text-ink md:text-5xl">
            Tasamos tu propiedad sin compromiso
          </h2>
          <p className="mt-5 max-w-lg text-ink-soft/75">
            Valor real de mercado, explicado. Si decidís vender, nos ocupamos
            de las fotos, la publicación, las visitas y los papeles.
          </p>
        </div>
        <div className="flex flex-col items-start gap-3 md:items-end">
          <Link
            href="/tasaciones"
            className="group inline-flex items-center gap-3 rounded-full bg-moss-600 px-8 py-4 text-sm font-medium text-mint-100 transition-colors hover:bg-moss-700"
          >
            Pedir mi tasación
            <span className="transition-transform group-hover:translate-x-1">→</span>
          </Link>
          <span className="text-xs text-ink-soft/55">Respondemos en el día</span>
        </div>
      </div>
    </section>
  );
}
