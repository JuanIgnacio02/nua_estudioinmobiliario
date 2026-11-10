"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import type { Lead, LeadStatus } from "@/lib/leads";
import { deleteLeadAction, updateLeadAction } from "@/app/admin/actions";
import { toast } from "./Toaster";
import { useConfirm } from "./ui";

const STATUS_LABEL: Record<LeadStatus, string> = {
  nueva: "Nueva",
  contactada: "Contactada",
  cerrada: "Cerrada",
  descartada: "Descartada",
};
const KIND_LABEL: Record<Lead["kind"], string> = {
  consulta: "Consulta por propiedad",
  contacto: "Contacto",
  tasacion: "Pedido de tasación",
};
const DETAIL_LABEL: Record<string, string> = {
  tipo: "Tipo",
  para: "Para",
  ubicacion: "Ubicación",
  superficie: "Superficie",
};

type Filter = "nueva" | "contactada" | "cerrada" | "todas";

/** Número para wa.me desde lo que escribió la persona (formatos argentinos). */
function waNumber(phone?: string) {
  if (!phone) return null;
  let d = phone.replace(/\D/g, "");
  if (d.startsWith("00")) d = d.slice(2);
  if (d.startsWith("54")) {
    d = d.slice(2);
    if (d.startsWith("9")) d = d.slice(1);
  }
  if (d.startsWith("0")) d = d.slice(1);
  // "260 15 4003217" → sin el 15 después de la característica.
  const m = d.match(/^(\d{2,4})15(\d{6,8})$/);
  if (m && (m[1] + m[2]).length === 10) d = m[1] + m[2];
  return d.length === 10 ? `549${d}` : d.length >= 8 ? `549${d}` : null;
}

function when(iso: string) {
  const date = new Date(iso);
  const diff = (Date.now() - date.getTime()) / 1000;
  const rtf = new Intl.RelativeTimeFormat("es", { numeric: "auto" });
  const rel =
    diff < 3600
      ? rtf.format(-Math.max(1, Math.round(diff / 60)), "minute")
      : diff < 86400
        ? rtf.format(-Math.round(diff / 3600), "hour")
        : rtf.format(-Math.round(diff / 86400), "day");
  const abs = date.toLocaleString("es-AR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Argentina/Mendoza",
  });
  return `${rel} · ${abs}`;
}

export default function LeadsInbox({ leads: initial }: { leads: Lead[] }) {
  const [leads, setLeads] = useState(initial);
  const [filter, setFilter] = useState<Filter>(initial.some((l) => l.status === "nueva") ? "nueva" : "todas");
  const [q, setQ] = useState("");

  const counts = useMemo(
    () => ({
      nueva: leads.filter((l) => l.status === "nueva").length,
      contactada: leads.filter((l) => l.status === "contactada").length,
      cerrada: leads.filter((l) => l.status === "cerrada" || l.status === "descartada").length,
      todas: leads.length,
    }),
    [leads]
  );

  const shown = useMemo(() => {
    const term = q.trim().toLowerCase();
    return leads.filter((l) => {
      if (filter === "cerrada" && l.status !== "cerrada" && l.status !== "descartada") return false;
      if ((filter === "nueva" || filter === "contactada") && l.status !== filter) return false;
      if (!term) return true;
      return [l.name, l.phone, l.email, l.message, l.propertyTitle, ...Object.values(l.details ?? {})]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(term);
    });
  }, [leads, filter, q]);

  const patchLocal = (id: string, patch: Partial<Lead>) =>
    setLeads((ls) => ls.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  const removeLocal = (id: string) => setLeads((ls) => ls.filter((l) => l.id !== id));

  const FILTERS: [Filter, string][] = [
    ["nueva", "Nuevas"],
    ["contactada", "En curso"],
    ["cerrada", "Cerradas"],
    ["todas", "Todas"],
  ];

  return (
    <>
      <div className="glass-panel mt-8 flex flex-col gap-3 p-3 md:flex-row md:items-center md:p-4">
        <div className="glass-segment no-scrollbar overflow-x-auto" role="group" aria-label="Filtrar consultas">
          {FILTERS.map(([f, label]) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              aria-pressed={filter === f}
              className={`glass-segment__btn whitespace-nowrap ${filter === f ? "is-active" : ""}`}
            >
              {label} <span className="ml-0.5 text-ink-soft/50">{counts[f]}</span>
            </button>
          ))}
        </div>
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por nombre, teléfono, propiedad…"
          aria-label="Buscar consultas"
          className="admin-input md:ml-auto md:max-w-xs"
        />
      </div>

      <ul className="mt-4 space-y-3">
        {shown.map((l) => (
          <LeadCard key={l.id} lead={l} onPatch={patchLocal} onRemove={removeLocal} />
        ))}
      </ul>

      {shown.length === 0 && (
        <div className="glass-panel mt-4 px-6 py-14 text-center">
          <p className="text-ink-soft/70">
            {leads.length === 0
              ? "Todavía no llegó ninguna consulta por la web. Cuando alguien complete un formulario, aparece acá."
              : filter === "nueva"
                ? "No hay consultas nuevas. ¡Todo al día!"
                : "No hay consultas con este filtro."}
          </p>
        </div>
      )}
    </>
  );
}

function LeadCard({
  lead: l,
  onPatch,
  onRemove,
}: {
  lead: Lead;
  onPatch: (id: string, patch: Partial<Lead>) => void;
  onRemove: (id: string) => void;
}) {
  const [notes, setNotes] = useState(l.notes ?? "");
  const [pending, startTransition] = useTransition();
  const [dialog, confirm] = useConfirm();
  const wa = waNumber(l.phone);
  const first = l.name?.split(/\s+/)[0] ?? "";
  const replyText = `Hola${first ? ` ${first}` : ""}, te escribimos de NÚA Estudio Inmobiliario por tu ${
    l.kind === "tasacion"
      ? "pedido de tasación"
      : l.propertyTitle
        ? `consulta por "${l.propertyTitle}"`
        : "consulta"
  }.`;

  const setStatus = (status: LeadStatus) => {
    const before = l.status;
    onPatch(l.id, { status });
    startTransition(async () => {
      const res = await updateLeadAction(l.id, { status });
      if (!res.ok) {
        onPatch(l.id, { status: before });
        toast(res.error ?? "No se pudo cambiar el estado", "error");
      }
    });
  };

  const saveNotes = () => {
    if (notes === (l.notes ?? "")) return;
    startTransition(async () => {
      const res = await updateLeadAction(l.id, { notes });
      if (res.ok) {
        onPatch(l.id, { notes });
        toast("Nota guardada");
      } else toast(res.error ?? "No se pudo guardar la nota", "error");
    });
  };

  const remove = async () => {
    const ok = await confirm({
      title: "¿Borrar esta consulta?",
      body: "Se borran los datos de contacto y las notas. No se puede deshacer.",
      confirmLabel: "Borrar",
    });
    if (!ok) return;
    startTransition(async () => {
      const res = await deleteLeadAction(l.id);
      if (res.ok) {
        onRemove(l.id);
        toast("Consulta borrada");
      } else toast(res.error ?? "No se pudo borrar", "error");
    });
  };

  // Al responder, si estaba "nueva" pasa sola a "contactada".
  const onReply = () => {
    if (l.status === "nueva") setStatus("contactada");
  };

  return (
    <li className={`glass-panel p-4 md:p-5 ${l.status === "nueva" ? "ring-1 ring-[#d9a441]/50" : ""}`}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        {l.status === "nueva" && (
          <span className="h-2 w-2 rounded-full bg-[#d9a441] shadow-[0_0_0_3px_rgba(217,164,65,0.22)]" aria-hidden />
        )}
        <span className={`glass-chip ${l.kind === "tasacion" ? "glass-chip--warn" : ""}`}>
          {KIND_LABEL[l.kind]}
        </span>
        <span className="text-xs text-ink-soft/55">{when(l.createdAt)}</span>
        <label className="ml-auto">
          <span className="sr-only">Estado</span>
          <select
            value={l.status}
            onChange={(e) => setStatus(e.target.value as LeadStatus)}
            disabled={pending}
            className="admin-input py-1.5 pl-3 text-xs"
          >
            {(Object.keys(STATUS_LABEL) as LeadStatus[]).map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s]}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-3 grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        {/* Quién y cómo responder */}
        <div>
          <p className="text-lg font-medium leading-snug text-ink">{l.name || "Sin nombre"}</p>
          <p className="mt-1 space-x-3 text-sm text-ink-soft/75">
            {l.phone && <span>{l.phone}</span>}
            {l.email && <span className="break-all">{l.email}</span>}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {wa && (
              <a
                href={`https://wa.me/${wa}?text=${encodeURIComponent(replyText)}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={onReply}
                className="glass-btn-primary px-4 py-2 text-xs"
              >
                Responder por WhatsApp
              </a>
            )}
            {l.phone && (
              <a href={`tel:${l.phone.replace(/[^\d+]/g, "")}`} onClick={onReply} className="glass-btn text-xs">
                Llamar
              </a>
            )}
            {l.email && (
              <a
                href={`mailto:${l.email}?subject=${encodeURIComponent("NÚA Estudio Inmobiliario")}&body=${encodeURIComponent(replyText)}`}
                onClick={onReply}
                className="glass-btn text-xs"
              >
                Email
              </a>
            )}
          </div>
          {l.propertySlug && (
            <p className="mt-3 text-sm">
              <span className="text-ink-soft/55">Propiedad: </span>
              <Link href={`/admin/propiedades/${l.propertySlug}`} className="text-moss-700 underline-offset-2 hover:underline">
                {l.propertyTitle}
              </Link>
            </p>
          )}
        </div>

        {/* Qué pidió */}
        <div className="min-w-0">
          {l.details && Object.keys(l.details).length > 0 && (
            <dl className="mb-3 flex flex-wrap gap-1.5">
              {Object.entries(l.details).map(([k, v]) => (
                <div key={k} className="rounded-full bg-white/70 px-3 py-1 text-xs">
                  <dt className="inline text-ink-soft/55">{DETAIL_LABEL[k] ?? k}: </dt>
                  <dd className="inline text-ink">{v}</dd>
                </div>
              ))}
            </dl>
          )}
          {l.message && (
            <p className="whitespace-pre-line rounded-xl bg-white/50 px-3.5 py-2.5 text-sm leading-relaxed text-ink-soft">
              {l.message}
            </p>
          )}
          <label className="mt-3 block">
            <span className="admin-label">Notas internas</span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={saveNotes}
              rows={2}
              placeholder="Ej: la llamé el martes, quiere visitar el sábado…"
              className="admin-input mt-1.5 resize-y text-sm"
            />
          </label>
        </div>
      </div>

      <div className="mt-2 flex justify-end">
        <button
          type="button"
          onClick={remove}
          className="rounded-full px-3 py-1.5 text-xs text-ink-soft/50 transition-colors hover:bg-red-500/10 hover:text-red-700"
        >
          Borrar consulta
        </button>
      </div>
      {dialog}
    </li>
  );
}
