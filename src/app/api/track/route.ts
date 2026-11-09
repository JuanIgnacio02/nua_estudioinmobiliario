import { NextResponse, type NextRequest } from "next/server";
import { EVENT_KINDS, GENERAL, recordEvent, type EventKind } from "@/lib/stats";
import { ADMIN_COOKIE, isValidToken } from "@/lib/auth";

/**
 * Cuenta una visita o un clic de WhatsApp (anónimo, sin cookies).
 * Lo llama el navegador con sendBeacon; siempre responde 204 para no
 * molestar a la página aunque algo falle.
 */
export const dynamic = "force-dynamic";

const BOTS = /bot|crawl|spider|slurp|preview|facebookexternalhit|whatsapp|lighthouse|headless/i;

export async function POST(req: NextRequest) {
  try {
    // Las dueñas mirando su propia web no suman.
    if (await isValidToken(req.cookies.get(ADMIN_COOKIE)?.value)) {
      return new NextResponse(null, { status: 204 });
    }
    if (BOTS.test(req.headers.get("user-agent") ?? "")) {
      return new NextResponse(null, { status: 204 });
    }
    const body = (await req.json()) as { slug?: unknown; kind?: unknown };
    const kind = body.kind as EventKind;
    const slug = typeof body.slug === "string" ? body.slug : GENERAL;
    if (!EVENT_KINDS.includes(kind)) return new NextResponse(null, { status: 204 });
    if (slug !== GENERAL && !/^[a-z0-9-]{1,120}$/.test(slug)) {
      return new NextResponse(null, { status: 204 });
    }
    await recordEvent(slug, kind);
  } catch (e) {
    console.error("[track]", e);
  }
  return new NextResponse(null, { status: 204 });
}
