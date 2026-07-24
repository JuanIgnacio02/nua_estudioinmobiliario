"use client";

import { useRef } from "react";
import {
  gsap,
  useIsomorphicLayoutEffect,
  prefersReducedMotion,
} from "@/lib/gsap";

const TEXT =
  "Una propiedad no es solo una operación: es una decisión importante en la vida de una persona. Acompañamos cada proceso con dedicación, transparencia y sensibilidad.";

export default function Manifesto() {
  const root = useRef<HTMLDivElement>(null);

  useIsomorphicLayoutEffect(() => {
    const el = root.current;
    if (!el) return;
    const words = el.querySelectorAll<HTMLElement>("[data-w]");

    if (prefersReducedMotion()) {
      gsap.set(words, { opacity: 1 });
      return;
    }

    const ctx = gsap.context(() => {
      gsap.fromTo(
        words,
        { opacity: 0.12 },
        {
          opacity: 1,
          ease: "none",
          stagger: 0.4,
          scrollTrigger: {
            trigger: el,
            start: "top 72%",
            end: "bottom 62%",
            scrub: true,
          },
        }
      );
    }, el);
    return () => ctx.revert();
  }, []);

  return (
    <section className="bg-bone py-28 md:py-44">
      <div className="mx-auto max-w-6xl px-6 md:px-10">
        <p className="text-eyebrow mb-10 text-sage-500">Nuestra filosofía</p>
        <p
          ref={root as React.RefObject<HTMLParagraphElement>}
          className="font-display text-3xl leading-[1.18] tracking-tight text-ink sm:text-4xl md:text-[3.4rem] md:leading-[1.12]"
        >
          {TEXT.split(" ").map((w, i) => (
            <span key={i} data-w className="inline-block">
              {w}
              {" "}
            </span>
          ))}
        </p>
      </div>
    </section>
  );
}
