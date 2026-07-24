"use client";

import { useState } from "react";

const WHATSAPP = "5492604003217";

export default function PropertyInquiry({
  propertyTitle,
}: {
  propertyTitle: string;
}) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    message: `Hola, me interesa la propiedad "${propertyTitle}". Me gustaría recibir más información.`,
  });

  const handle =
    (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = encodeURIComponent(
      `${form.message}\n\nNombre: ${form.name}\nEmail: ${form.email}\nTel: ${form.phone}`
    );
    window.open(`https://wa.me/${WHATSAPP}?text=${text}`, "_blank");
  };

  return (
    <form onSubmit={onSubmit} className="grid gap-6 sm:grid-cols-2">
      <label className="block">
        <span className="text-eyebrow text-sage-500">Nombre</span>
        <input
          required
          value={form.name}
          onChange={handle("name")}
          className="nua-input mt-2"
          placeholder="Tu nombre"
        />
      </label>
      <label className="block">
        <span className="text-eyebrow text-sage-500">Teléfono</span>
        <input
          value={form.phone}
          onChange={handle("phone")}
          className="nua-input mt-2"
          placeholder="+54 9 ..."
        />
      </label>
      <label className="block sm:col-span-2">
        <span className="text-eyebrow text-sage-500">Email</span>
        <input
          type="email"
          required
          value={form.email}
          onChange={handle("email")}
          className="nua-input mt-2"
          placeholder="tu@email.com"
        />
      </label>
      <label className="block sm:col-span-2">
        <span className="text-eyebrow text-sage-500">Mensaje</span>
        <textarea
          required
          rows={4}
          value={form.message}
          onChange={handle("message")}
          className="nua-input mt-2 resize-none"
        />
      </label>
      <div className="sm:col-span-2">
        <button
          type="submit"
          className="group inline-flex w-full items-center justify-center gap-3 rounded-full bg-moss-600 px-8 py-4 text-sm font-medium text-mint-100 transition-colors hover:bg-moss-700 sm:w-auto"
        >
          Solicitar información
          <span className="transition-transform group-hover:translate-x-1">→</span>
        </button>
        <p className="mt-3 text-xs text-ink-soft/50">
          Se abrirá WhatsApp con tu consulta lista para enviar.
        </p>
      </div>
    </form>
  );
}
