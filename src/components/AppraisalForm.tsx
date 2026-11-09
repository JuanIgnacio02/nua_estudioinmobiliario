"use client";

import { useState } from "react";
import { track } from "@/lib/track";

const TYPES = ["Casa", "Departamento", "Terreno / lote", "Finca", "Local / comercial", "Otro"];
const GOALS = ["Vender", "Alquilar", "Solo saber el valor"];

export default function AppraisalForm({ phoneHref }: { phoneHref: string }) {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    type: TYPES[0],
    goal: GOALS[0],
    address: "",
    area: "",
    notes: "",
  });
  const set =
    (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const property = [
      `Tipo: ${form.type}`,
      `Para: ${form.goal}`,
      `Ubicación: ${form.address}`,
      form.area ? `Superficie aprox.: ${form.area} m²` : "",
      form.notes ? `Comentarios: ${form.notes}` : "",
    ].filter(Boolean);
    const contact = [`Nombre: ${form.name}`, form.phone ? `Teléfono: ${form.phone}` : ""].filter(
      Boolean
    );
    const text = [
      "Hola NÚA, quiero pedir una tasación.",
      property.join("\n"),
      contact.join("\n"),
    ].join("\n\n");
    track("tasacion");
    window.open(`https://wa.me/${phoneHref}?text=${encodeURIComponent(text)}`, "_blank");
  };

  const field = "nua-input mt-2";
  const label = "text-eyebrow text-sage-500";

  return (
    <form onSubmit={onSubmit} className="mt-8 grid gap-6 sm:grid-cols-2">
      <label className="block">
        <span className={label}>Tipo de propiedad</span>
        <select value={form.type} onChange={set("type")} className={`${field} cursor-pointer`}>
          {TYPES.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className={label}>¿Qué querés hacer?</span>
        <select value={form.goal} onChange={set("goal")} className={`${field} cursor-pointer`}>
          {GOALS.map((g) => (
            <option key={g}>{g}</option>
          ))}
        </select>
      </label>
      <label className="block sm:col-span-2">
        <span className={label}>Dirección o zona</span>
        <input
          required
          value={form.address}
          onChange={set("address")}
          className={field}
          placeholder="Ej: Barrio Pueyrredón, San Rafael"
        />
      </label>
      <label className="block">
        <span className={label}>Superficie aprox. (m²)</span>
        <input
          value={form.area}
          onChange={set("area")}
          inputMode="numeric"
          className={field}
          placeholder="Opcional"
        />
      </label>
      <label className="block">
        <span className={label}>Tu nombre</span>
        <input required value={form.name} onChange={set("name")} className={field} placeholder="Nombre" />
      </label>
      <label className="block sm:col-span-2">
        <span className={label}>Teléfono</span>
        <input
          value={form.phone}
          onChange={set("phone")}
          inputMode="tel"
          className={field}
          placeholder="Opcional: te respondemos por WhatsApp igual"
        />
      </label>
      <label className="block sm:col-span-2">
        <span className={label}>Algo más que debamos saber</span>
        <textarea
          rows={3}
          value={form.notes}
          onChange={set("notes")}
          className={`${field} resize-none`}
          placeholder="Ambientes, estado, si tiene escritura, apuro por vender…"
        />
      </label>
      <div className="sm:col-span-2">
        <button
          type="submit"
          className="group inline-flex w-full items-center justify-center gap-3 rounded-full bg-moss-600 px-8 py-4 text-sm font-medium text-mint-100 transition-colors hover:bg-moss-700"
        >
          Pedir tasación por WhatsApp
          <span className="transition-transform group-hover:translate-x-1">→</span>
        </button>
      </div>
    </form>
  );
}
