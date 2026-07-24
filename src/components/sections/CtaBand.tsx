import Link from "next/link";
import AnimatedHeading from "@/components/anim/AnimatedHeading";

export default function CtaBand() {
  return (
    <section className="bg-bone pb-24 pt-8 md:pb-32">
      <div className="mx-auto max-w-[1600px] px-5 md:px-10">
        <div className="relative overflow-hidden rounded-[2rem] bg-moss-900 px-8 py-20 text-center md:px-16 md:py-32">
          <p className="text-eyebrow mb-8 text-celadon-300">
            ¿Listo para dar el paso?
          </p>
          <AnimatedHeading
            text="Hablemos de tu próxima propiedad"
            className="text-display mx-auto max-w-[18ch] font-display text-mint-50"
          />
          <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/contacto"
              className="group inline-flex items-center gap-3 rounded-full bg-mint-50 px-8 py-4 text-sm font-medium text-moss-700 transition-colors hover:bg-white"
            >
              Contactanos
              <span className="transition-transform group-hover:translate-x-1">
                →
              </span>
            </Link>
            <Link
              href="/propiedades"
              className="inline-flex items-center gap-3 rounded-full border border-mint-100/30 px-8 py-4 text-sm text-mint-50 transition-colors hover:bg-mint-100/10"
            >
              Ver propiedades
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
