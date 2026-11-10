import { NextResponse, type NextRequest } from "next/server";
import { addLead, LEAD_KINDS, type LeadKind } from "@/lib/leads";
import { getStore } from "@/lib/store";
import { findProperty } from "@/lib/properties";

/**
 * Guarda en la bandeja del admin lo que alguien manda por un formulario.
 * El formulario abre WhatsApp igual: esto es para que no se pierda ninguna
 * consulta. Siempre responde 204 (la persona no tiene que esperar ni ver
 * errores nuestros).
 */
export const dynamic = "force-dynamic";

const BOTS = /bot|crawl|spider|headless|lighthouse/i;

/** Texto limpio y con largo máximo. */
function clean(v: unknown, max: number) {
  if (typeof v !== "string") return undefined;
  const t = v.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "").trim();
  return t ? t.slice(0, max) : undefined;
}

export async function POST(req: NextRequest) {
  try {
    if (BOTS.test(req.headers.get("user-agent") ?? "")) {
      return new NextResponse(null, { status: 204 });
    }
    const body = (await req.json()) as Record<string, unknown>;
    // Trampa para robots: un campo oculto que una persona nunca completa.
    if (clean(body.empresa, 200)) return new NextResponse(null, { status: 204 });

    const kind = body.kind as LeadKind;
    if (!LEAD_KINDS.includes(kind)) return new NextResponse(null, { status: 204 });

    const name = clean(body.name, 120);
    const phone = clean(body.phone, 40);
    const email = clean(body.email, 160);
    const message = clean(body.message, 3000);
    // Sin nada con qué contactar a la persona, no sirve guardarlo.
    if (!name && !phone && !email) return new NextResponse(null, { status: 204 });

    // El título se busca acá: no se confía en lo que manda el navegador.
    let propertySlug: string | undefined;
    let propertyTitle: string | undefined;
    const slug = clean(body.slug, 120);
    if (slug && /^[a-z0-9-]+$/.test(slug)) {
      const { properties } = await getStore();
      const p = findProperty(properties, slug);
      if (p) {
        propertySlug = p.slug;
        propertyTitle = p.title;
      }
    }

    const rawDetails =
      body.details && typeof body.details === "object" ? (body.details as Record<string, unknown>) : {};
    const details: Record<string, string> = {};
    for (const [k, v] of Object.entries(rawDetails).slice(0, 10)) {
      const val = clean(v, 300);
      if (val && /^[a-zA-Z]{1,30}$/.test(k)) details[k] = val;
    }

    await addLead({ kind, name, phone, email, message, propertySlug, propertyTitle, details });
  } catch (e) {
    console.error("[leads]", e);
  }
  return new NextResponse(null, { status: 204 });
}
