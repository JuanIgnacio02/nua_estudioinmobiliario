import Link from "next/link";
import AnimatedHeading from "@/components/anim/AnimatedHeading";
import Logo from "@/components/Logo";

export default function CtaBand() {
  return (
    <section className="bg-bone pb-24 pt-8 md:pb-32">
      <div className="mx-auto max-w-[1600px] px-5 md:px-10">
        <div className="relative overflow-hidden rounded-[2rem] bg-celadon-400 px-8 py-20 text-center md:px-16 md:py-32">
          {/* Decorative NÚA wordmark backdrop */}
          <div className="pointer-events-none absolute -bottom-[22%] left-1/2 w-[135%] -translate-x-1/2 text-moss-900/[0.06]">
            <Logo className="h-auto w-full" />
          </div>

          <div className="relative">
            <p className="text-eyebrow mb-8 text-moss-700">
            ¿Listo para dar el paso?
          </p>
          <AnimatedHeading
            text="Hablemos de tu próxima propiedad"
            className="text-display mx-auto max-w-[18ch] font-display text-moss-900"
          />
          <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/contacto"
              className="group inline-flex items-center gap-3 rounded-full bg-moss-900 px-8 py-4 text-sm font-medium text-mint-50 transition-colors hover:bg-moss-700"
            >
              Contactanos
              <span className="transition-transform group-hover:translate-x-1">
                →
              </span>
            </Link>
            <Link
              href="/propiedades"
              className="inline-flex items-center gap-3 rounded-full border border-moss-900/30 px-8 py-4 text-sm text-moss-900 transition-colors hover:bg-moss-900/5"
            >
              Ver propiedades
            </Link>
          </div>
          </div>
        </div>
      </div>
    </section>
  );
}
