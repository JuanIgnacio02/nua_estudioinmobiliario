"use client";

import { useState } from "react";
import Reveal from "@/components/anim/Reveal";
import { defaultSettings, type SiteSettings } from "@/lib/properties";

export default function Contact({
  contact = defaultSettings.contact,
}: {
  contact?: SiteSettings["contact"];
}) {
  const CONTACT = contact;
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });

  const handle =
    (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = encodeURIComponent(
      `Hola NÚA, soy ${form.name}.\n${form.message}\n\nEmail: ${form.email}\nTel: ${form.phone}`
    );
    window.open(`https://wa.me/${CONTACT.phoneHref}?text=${text}`, "_blank");
  };

  return (
    <section id="contacto" className="bg-bone py-20 md:py-28">
      <div className="mx-auto max-w-[1600px] px-5 md:px-10">
        <div className="grid gap-14 lg:grid-cols-[1fr_1.1fr] lg:gap-24">
          {/* Left: contact details */}
          <div>
            <Reveal className="max-w-md text-xl text-ink-soft/80">
              <p>
                Contanos qué estás buscando y nuestro equipo se pondrá en
                contacto lo antes posible. Estamos en San Rafael y trabajamos en
                toda Mendoza.
              </p>
            </Reveal>

            <div className="mt-12 space-y-8">
              <a href={`mailto:${CONTACT.email}`} className="group block">
                <span className="text-eyebrow text-sage-400">Email</span>
                <p className="mt-1 break-all font-display text-2xl text-ink transition-colors group-hover:text-moss-600 md:text-3xl">
                  {CONTACT.email}
                </p>
              </a>
              <a
                href={`https://wa.me/${CONTACT.phoneHref}`}
                target="_blank"
                rel="noopener noreferrer"
                className="group block"
              >
                <span className="text-eyebrow text-sage-400">
                  Teléfono · WhatsApp
                </span>
                <p className="mt-1 font-display text-2xl text-ink transition-colors group-hover:text-moss-600 md:text-3xl">
                  {CONTACT.phone}
                </p>
              </a>
              <div>
                <span className="text-eyebrow text-sage-400">Zona</span>
                <p className="mt-1 font-display text-2xl text-ink md:text-3xl">
                  San Rafael, Mendoza
                </p>
              </div>
            </div>
          </div>

          {/* Form */}
          <Reveal
            as="form"
            onSubmit={onSubmit}
            className="rounded-3xl border border-moss-600/10 bg-mint-50/60 p-6 backdrop-blur-sm md:p-10"
          >
            <div className="grid gap-6 sm:grid-cols-2">
              <Field label="Nombre completo" htmlFor="name">
                <input
                  id="name"
                  required
                  value={form.name}
                  onChange={handle("name")}
                  className="nua-input"
                  placeholder="Tu nombre"
                />
              </Field>
              <Field label="Teléfono" htmlFor="phone">
                <input
                  id="phone"
                  value={form.phone}
                  onChange={handle("phone")}
                  className="nua-input"
                  placeholder="+54 9 ..."
                />
              </Field>
            </div>
            <div className="mt-6">
              <Field label="Correo electrónico" htmlFor="email">
                <input
                  id="email"
                  type="email"
                  required
                  value={form.email}
                  onChange={handle("email")}
                  className="nua-input"
                  placeholder="tu@email.com"
                />
              </Field>
            </div>
            <div className="mt-6">
              <Field label="Mensaje" htmlFor="message">
                <textarea
                  id="message"
                  required
                  rows={5}
                  value={form.message}
                  onChange={handle("message")}
                  className="nua-input resize-none"
                  placeholder="Contanos qué estás buscando..."
                />
              </Field>
            </div>
            <button
              type="submit"
              className="group mt-8 inline-flex w-full items-center justify-center gap-3 rounded-full bg-moss-600 px-8 py-4 text-sm font-medium text-mint-100 transition-colors hover:bg-moss-700 sm:w-auto"
            >
              Enviar mensaje
              <span className="transition-transform group-hover:translate-x-1">
                →
              </span>
            </button>
            <p className="mt-4 text-xs text-ink-soft/50">
              Se abrirá WhatsApp con tu mensaje listo para enviar.
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <label htmlFor={htmlFor} className="block">
      <span className="text-eyebrow text-sage-500">{label}</span>
      <div className="mt-2">{children}</div>
    </label>
  );
}
