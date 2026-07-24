"use client";

import Image from "next/image";
import { useRef } from "react";
import AnimatedHeading from "@/components/anim/AnimatedHeading";
import Reveal from "@/components/anim/Reveal";
import {
  gsap,
  useIsomorphicLayoutEffect,
  prefersReducedMotion,
} from "@/lib/gsap";
import { defaultSettings, type SiteSettings } from "@/lib/properties";

const VALUES = [
  { n: "01", t: "Cercanía", d: "Escucha atenta en cada etapa del proceso." },
  { n: "02", t: "Transparencia", d: "Información clara para decidir con seguridad." },
  { n: "03", t: "Compromiso", d: "Energía puesta en cada operación." },
  { n: "04", t: "Acompañamiento", d: "Detrás de cada venta hay una historia." },
];

export default function About({
  about = defaultSettings.about,
}: {
  about?: SiteSettings["about"];
}) {
  const img = useRef<HTMLDivElement>(null);
  const PILLARS = about.pillars;

  useIsomorphicLayoutEffect(() => {
    if (prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      // Clip reveal on the image. Starts near the bottom of the viewport so it
      // plays on load when it's already in view (no empty gap on landing).
      gsap.from(img.current, {
        clipPath: "inset(0 0 100% 0)",
        duration: 1.3,
        ease: "power4.out",
        scrollTrigger: { trigger: img.current, start: "top 98%" },
      });
      // Values stagger in.
      gsap.from("[data-value]", {
        y: 40,
        autoAlpha: 0,
        duration: 0.9,
        ease: "power3.out",
        stagger: 0.1,
        scrollTrigger: { trigger: "[data-values]", start: "top 82%" },
      });
    });
    return () => ctx.revert();
  }, []);

  return (
    <section
      id="nosotras"
      className="overflow-hidden bg-moss-900 pb-24 pt-28 text-mint-100 md:pb-32 md:pt-32"
    >
      <div className="mx-auto max-w-[1600px] px-5 md:px-10">
        {/* Header */}
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-eyebrow mb-6 text-celadon-300">Sobre nosotras</p>
            <AnimatedHeading
              immediate
              delay={0.15}
              text="Tus socias de confianza"
              className="font-display text-mint-50 text-[clamp(2.5rem,6vw,5.25rem)] leading-[0.95]"
            />
          </div>
          <p className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-celadon-300/80 md:max-w-xs md:justify-end md:text-right">
            {PILLARS.map((p, i) => (
              <span key={p}>
                {p}
                {i < PILLARS.length - 1 && (
                  <span className="ml-3 text-sage-400">·</span>
                )}
              </span>
            ))}
          </p>
        </div>

        {/* Editorial split */}
        <div className="mt-10 grid gap-10 lg:mt-14 lg:grid-cols-[1fr_1.1fr] lg:gap-20">
          {/* Image — native-ish ratio, no upscale, framed */}
          <div className="lg:pt-4">
            <div
              ref={img}
              className="relative aspect-[7/6] w-full overflow-hidden rounded-2xl ring-1 ring-mint-100/10"
            >
              <Image
                src={about.teamImage}
                alt="El equipo de NÚA Estudio Inmobiliario"
                fill
                sizes="(max-width: 1024px) 100vw, 45vw"
                quality={90}
                className="object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-moss-900/40 via-transparent to-transparent" />
            </div>
            <div className="mt-4 flex items-center justify-between text-xs uppercase tracking-[0.2em] text-celadon-300/70">
              <span>El equipo</span>
              <span>San Rafael, Mendoza</span>
            </div>
          </div>

          {/* Text */}
          <div className="flex flex-col justify-center">
            <Reveal className="max-w-xl space-y-6 text-xl leading-relaxed text-mint-100/85 md:text-2xl md:leading-relaxed">
              {about.paragraphs.map((para, i) => (
                <p
                  key={i}
                  className={
                    i === 0 ? "" : "text-lg text-mint-100/65 md:text-xl"
                  }
                >
                  {para}
                </p>
              ))}
            </Reveal>
          </div>
        </div>

        {/* Values — editorial rule list */}
        <div
          data-values
          className="mt-24 grid gap-px border-t border-mint-100/15 md:grid-cols-4"
        >
          {VALUES.map((v) => (
            <div
              key={v.n}
              data-value
              className="group border-t border-mint-100/10 pt-6 md:border-t-0 md:pr-8"
            >
              <div className="flex items-baseline gap-3">
                <span className="font-display text-sm text-sage-400">{v.n}</span>
                <span className="h-px flex-1 bg-mint-100/15 transition-colors group-hover:bg-celadon-300/50" />
              </div>
              <h3 className="mt-5 font-display text-3xl text-mint-50">{v.t}</h3>
              <p className="mt-3 text-sm leading-relaxed text-mint-100/60">
                {v.d}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
