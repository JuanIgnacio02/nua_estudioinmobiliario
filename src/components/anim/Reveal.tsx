"use client";

import { useRef, ElementType } from "react";
import { gsap, ScrollTrigger, useIsomorphicLayoutEffect, prefersReducedMotion } from "@/lib/gsap";

type RevealProps = {
  children: React.ReactNode;
  className?: string;
  as?: ElementType;
  /** Delay in seconds. */
  delay?: number;
  /** Vertical travel in px. */
  y?: number;
  /** Stagger children (direct element children) instead of the block itself. */
  stagger?: boolean;
  /** Extra props forwarded to the rendered element (e.g. onSubmit on a form). */
  [key: string]: unknown;
};

/**
 * Fade + rise on scroll into view. If `stagger` is set, animates the direct
 * children with a stagger; otherwise the element itself.
 */
export default function Reveal({
  children,
  className,
  as = "div",
  delay = 0,
  y = 40,
  stagger = false,
  ...rest
}: RevealProps) {
  const ref = useRef<HTMLElement>(null);
  const Tag = as as ElementType;

  useIsomorphicLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (prefersReducedMotion()) {
      gsap.set(el, { autoAlpha: 1 });
      return;
    }

    const ctx = gsap.context(() => {
      const targets = stagger ? Array.from(el.children) : el;
      gsap.set(targets, { autoAlpha: 0, y });
      gsap.to(targets, {
        autoAlpha: 1,
        y: 0,
        duration: 1.1,
        delay,
        ease: "power3.out",
        stagger: stagger ? 0.09 : 0,
        scrollTrigger: {
          trigger: el,
          start: "top 82%",
        },
      });
    }, el);

    return () => ctx.revert();
  }, [delay, y, stagger]);

  return (
    <Tag ref={ref} className={className} {...rest}>
      {children}
    </Tag>
  );
}

/** Re-export for convenience in sections that need raw ScrollTrigger. */
export { ScrollTrigger };
