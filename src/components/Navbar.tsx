"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Logo from "./Logo";
import {
  gsap,
  useIsomorphicLayoutEffect,
  prefersReducedMotion,
} from "@/lib/gsap";

const LINKS = [
  { label: "Inicio", href: "/" },
  { label: "Propiedades", href: "/propiedades" },
  { label: "Lotes", href: "/lotes" },
  { label: "Sobre nosotras", href: "/nosotras" },
  { label: "Contacto", href: "/contacto" },
];

const CONTACT = {
  email: "fq.nuaestudioinmobiliario@gmail.com",
  phone: "+54 9 260 400 3217",
};

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const overlay = useRef<HTMLDivElement>(null);
  const tl = useRef<gsap.core.Timeline | null>(null);

  // Solid bar after leaving the (dark) top area.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Intro slide-in.
  useIsomorphicLayoutEffect(() => {
    gsap.fromTo(
      "[data-nav]",
      { y: -60, autoAlpha: 0 },
      { y: 0, autoAlpha: 1, duration: 1, ease: "power3.out", delay: 0.15 }
    );
  }, []);

  // Build the overlay open/close timeline once.
  useIsomorphicLayoutEffect(() => {
    if (prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      const t = gsap
        .timeline({ paused: true })
        .set(overlay.current, { display: "flex" })
        .fromTo(
          overlay.current,
          { clipPath: "inset(0 0 100% 0)" },
          { clipPath: "inset(0 0 0% 0)", duration: 0.7, ease: "power4.inOut" }
        )
        .from(
          "[data-menu-item]",
          {
            yPercent: 120,
            duration: 0.7,
            ease: "power4.out",
            stagger: 0.06,
          },
          "-=0.25"
        )
        .from(
          "[data-menu-meta]",
          { autoAlpha: 0, y: 20, duration: 0.5, stagger: 0.08 },
          "-=0.4"
        );
      tl.current = t;
    }, overlay);
    return () => ctx.revert();
  }, []);

  // Play / reverse on state change; lock body scroll.
  useEffect(() => {
    const t = tl.current;
    if (t) {
      if (open) t.play();
      else t.reverse();
    } else if (overlay.current) {
      // reduced-motion fallback
      overlay.current.style.display = open ? "flex" : "none";
    }
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Close on route change.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const light = !scrolled && !open; // white text over dark hero/header

  return (
    <>
      <header
        data-nav
        className={`fixed inset-x-0 top-0 z-50 transition-colors duration-500 ${
          scrolled
            ? "border-b border-moss-600/10 bg-bone/85 backdrop-blur-xl"
            : "bg-transparent"
        }`}
      >
        <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between px-5 md:h-[72px] md:px-10">
          <Link
            href="/"
            aria-label="NÚA — Inicio"
            className={`shrink-0 transition-colors duration-500 ${
              light ? "text-mint-50" : "text-moss-600"
            }`}
          >
            <Logo className="h-6 w-auto md:h-7" />
          </Link>

          <div className="flex items-center gap-6 md:gap-10">
            {/* Desktop inline links (understated, SAOTA-like) */}
            <nav className="hidden items-center gap-8 lg:flex">
              {LINKS.slice(0, 3).map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`text-sm font-light tracking-wide transition-colors duration-300 ${
                    light
                      ? "text-mint-50/80 hover:text-mint-50"
                      : "text-ink-soft hover:text-moss-600"
                  }`}
                >
                  {l.label}
                </Link>
              ))}
            </nav>

            {/* Menu toggle */}
            <button
              onClick={() => setOpen((o) => !o)}
              aria-label={open ? "Cerrar menú" : "Abrir menú"}
              aria-expanded={open}
              data-cursor={open ? "Cerrar" : "Menú"}
              className={`group flex items-center gap-3 transition-colors duration-500 ${
                open ? "text-ink" : light ? "text-mint-50" : "text-ink"
              }`}
            >
              <span className="hidden text-xs font-light uppercase tracking-[0.25em] sm:inline">
                {open ? "Cerrar" : "Menú"}
              </span>
              <span className="relative flex h-4 w-7 flex-col justify-center">
                <span
                  className={`absolute h-px w-7 bg-current transition-all duration-300 ${
                    open ? "rotate-45" : "-translate-y-1"
                  }`}
                />
                <span
                  className={`absolute h-px w-7 bg-current transition-all duration-300 ${
                    open ? "opacity-0" : "opacity-100"
                  }`}
                />
                <span
                  className={`absolute h-px w-7 bg-current transition-all duration-300 ${
                    open ? "-rotate-45" : "translate-y-1"
                  }`}
                />
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Fullscreen overlay menu */}
      <div
        ref={overlay}
        className="fixed inset-0 z-40 hidden flex-col justify-between bg-mint-100 px-5 pb-10 pt-28 md:px-10 md:pt-32"
        style={{ clipPath: "inset(0 0 100% 0)" }}
      >
        <div className="mx-auto grid w-full max-w-[1600px] flex-1 grid-cols-1 gap-12 lg:grid-cols-[1.4fr_1fr]">
          {/* Big links */}
          <nav className="flex flex-col justify-center">
            {LINKS.map((l, i) => (
              <div key={l.href} className="overflow-hidden">
                <Link
                  data-menu-item
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="group flex items-baseline gap-4 py-1.5 font-display text-[11vw] leading-[1.02] tracking-tight text-moss-700 transition-colors hover:text-moss-900 md:text-[7.5vw] lg:text-[6vw]"
                >
                  <span className="font-sans text-base text-sage-400">
                    0{i + 1}
                  </span>
                  <span className="relative inline-block">
                    {l.label}
                    <span className="absolute -bottom-1 left-0 h-px w-0 bg-moss-700 transition-all duration-500 group-hover:w-full" />
                  </span>
                </Link>
              </div>
            ))}
          </nav>

          {/* Side: featured image + contact */}
          <div className="flex flex-col justify-center gap-8">
            <div
              data-menu-meta
              className="relative hidden aspect-[5/4] overflow-hidden rounded-2xl lg:block"
            >
              <Image
                src="/images/properties/casa-fincas-diamante.webp"
                alt="Propiedad destacada NÚA"
                fill
                sizes="30vw"
                className="object-cover"
              />
            </div>
            <div data-menu-meta className="space-y-1">
              <p className="text-eyebrow text-sage-500">Contacto</p>
              <a
                href={`mailto:${CONTACT.email}`}
                className="block break-all text-lg text-moss-700 transition-colors hover:text-moss-900"
              >
                {CONTACT.email}
              </a>
              <a
                href={`https://wa.me/5492604003217`}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-lg text-moss-700 transition-colors hover:text-moss-900"
              >
                {CONTACT.phone}
              </a>
            </div>
          </div>
        </div>

        <div
          data-menu-meta
          className="mx-auto flex w-full max-w-[1600px] items-center justify-between border-t border-moss-700/15 pt-6 text-xs uppercase tracking-[0.2em] text-sage-500"
        >
          <span>San Rafael · Mendoza</span>
          <span>NÚA Estudio Inmobiliario</span>
        </div>
      </div>
    </>
  );
}
