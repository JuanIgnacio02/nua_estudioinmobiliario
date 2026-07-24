"use client";

import Image from "next/image";
import { useRef } from "react";
import Link from "next/link";
import {
  gsap,
  ScrollTrigger,
  useIsomorphicLayoutEffect,
  prefersReducedMotion,
} from "@/lib/gsap";
import AnimatedHeading from "@/components/anim/AnimatedHeading";

export default function Hero() {
  const root = useRef<HTMLDivElement>(null);
  const imgWrap = useRef<HTMLDivElement>(null);

  useIsomorphicLayoutEffect(() => {
    if (prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      // Slow zoom-out on load.
      gsap.fromTo(
        imgWrap.current,
        { scale: 1.25 },
        { scale: 1, duration: 2.2, ease: "power3.out" }
      );
      // Parallax + fade as you scroll away.
      gsap.to(imgWrap.current, {
        yPercent: 22,
        ease: "none",
        scrollTrigger: {
          trigger: root.current,
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      });
      gsap.to("[data-hero-content]", {
        yPercent: -30,
        autoAlpha: 0,
        ease: "none",
        scrollTrigger: {
          trigger: root.current,
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      });
      // Scroll cue fade.
      gsap.to("[data-hero-cue]", {
        autoAlpha: 0,
        duration: 0.4,
        scrollTrigger: { trigger: root.current, start: "top+=120 top" },
      });
    }, root);
    return () => {
      ctx.revert();
      ScrollTrigger.refresh();
    };
  }, []);

  return (
    <section
      id="inicio"
      ref={root}
      className="relative flex h-[100svh] min-h-[640px] w-full items-end overflow-hidden bg-moss-900"
    >
      <div ref={imgWrap} className="absolute inset-0 will-change-transform">
        <Image
          src="/images/hero-home-lg.webp"
          alt="Propiedad destacada de NÚA Estudio Inmobiliario"
          fill
          priority
          quality={90}
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-moss-900/85 via-moss-900/25 to-moss-900/40" />
      </div>

      <div
        data-hero-content
        className="relative z-10 mx-auto w-full max-w-7xl px-6 pb-16 md:px-10 md:pb-24"
      >
        <p
          className="text-eyebrow mb-6 text-mint-100/80"
          style={{ animation: "heroEyebrow 1s 0.5s forwards", opacity: 0 }}
        >
          San Rafael · Mendoza · Argentina
        </p>

        <AnimatedHeading
          as="h1"
          immediate
          delay={0.55}
          text="Confianza que construye futuro"
          className="text-hero max-w-[15ch] font-display text-mint-50"
        />

        <div
          className="mt-10 flex flex-col gap-5 sm:flex-row sm:items-center"
          style={{ animation: "heroEyebrow 1s 1.3s forwards", opacity: 0 }}
        >
          <Link
            href="/propiedades"
            data-cursor="Ver todo"
            className="group inline-flex items-center gap-3 rounded-full bg-mint-50 px-7 py-3.5 text-sm font-medium text-moss-700 transition-colors hover:bg-white"
          >
            Descubrir propiedades
            <span className="transition-transform group-hover:translate-x-1">
              →
            </span>
          </Link>
          <Link
            href="/nosotras"
            className="inline-flex items-center gap-3 rounded-full border border-mint-100/40 px-7 py-3.5 text-sm text-mint-50 transition-colors hover:bg-mint-100/10"
          >
            Conocer más
          </Link>
        </div>
      </div>

      <div
        data-hero-cue
        className="absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-2 text-mint-100/70"
      >
        <span className="text-[10px] uppercase tracking-[0.3em]">Scroll</span>
        <span className="h-10 w-px animate-pulse bg-mint-100/40" />
      </div>

      <style>{`
        @keyframes heroEyebrow {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </section>
  );
}
