"use client";

import { useRef, ElementType } from "react";
import { gsap, useIsomorphicLayoutEffect, prefersReducedMotion } from "@/lib/gsap";

type Props = {
  text: string;
  className?: string;
  as?: ElementType;
  /** Animate on mount instead of on scroll (for the hero). */
  immediate?: boolean;
  delay?: number;
};

/**
 * Splits text into words wrapped in masks and reveals them with a rising,
 * slightly staggered motion — the signature editorial reveal.
 */
export default function AnimatedHeading({
  text,
  className,
  as = "h2",
  immediate = false,
  delay = 0,
}: Props) {
  const ref = useRef<HTMLElement>(null);
  const Tag = as as ElementType;
  const words = text.split(" ");

  useIsomorphicLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const inners = el.querySelectorAll<HTMLElement>("[data-word]");

    if (prefersReducedMotion()) {
      gsap.set(inners, { yPercent: 0, autoAlpha: 1 });
      return;
    }

    const ctx = gsap.context(() => {
      gsap.set(inners, { yPercent: 115 });
      gsap.to(inners, {
        yPercent: 0,
        duration: 1.15,
        ease: "power4.out",
        stagger: 0.08,
        delay,
        scrollTrigger: immediate
          ? undefined
          : { trigger: el, start: "top 85%" },
      });
    }, el);

    return () => ctx.revert();
  }, [immediate, delay, text]);

  return (
    <Tag ref={ref} className={className}>
      {words.map((word, i) => (
        <span
          key={i}
          className="inline-block overflow-hidden align-bottom"
          style={{ paddingBottom: "0.12em", marginBottom: "-0.12em" }}
        >
          <span data-word className="inline-block will-change-transform">
            {word}
            {i < words.length - 1 ? " " : ""}
          </span>
        </span>
      ))}
    </Tag>
  );
}
