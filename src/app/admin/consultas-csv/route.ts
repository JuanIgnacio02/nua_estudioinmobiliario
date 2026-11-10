import { type NextRequest } from "next/server";
import { ADMIN_COOKIE, isValidToken } from "@/lib/auth";
import { listLeads } from "@/lib/leads";

/** Planilla de consultas para abrir en Excel (separador ; y tildes OK). */
export const dynamic = "force-dynamic";

const cell = (v: unknown) => {
  const t = String(v ?? "").replace(/\r?\n/g, " ").trim();
  // Evita que Excel interprete un texto como fórmula.
  const safe = /^[=+\-@]/.test(t) ? `'${t}` : t;
  return /[;"]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
};

export async function GET(req: NextRequest) {
  if (!(await isValidToken(req.cookies.get(ADMIN_COOKIE)?.value))) {
    return new Response("No autorizado", { status: 401 });
  }
  const leads = await listLeads();
  const head = ["Fecha", "Tipo", "Estado", "Nombre", "Teléfono", "Email", "Propiedad", "Mensaje", "Detalles", "Notas"];
  const rows = leads.map((l) => [
    new Date(l.createdAt).toLocaleString("es-AR", { timeZone: "America/Argentina/Mendoza" }),
    l.kind,
    l.status,
    l.name,
    l.phone,
    l.email,
    l.propertyTitle,
    l.message,
    Object.entries(l.details ?? {}).map(([k, v]) => `${k}: ${v}`).join(" | "),
    l.notes,
  ]);
  const csv = "﻿" + [head, ...rows].map((r) => r.map(cell).join(";")).join("\r\n");
  const fecha = new Date().toISOString().slice(0, 10);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="consultas-nua-${fecha}.csv"`,
      "Cache-Control": "private, no-store",
    },
  });
}
