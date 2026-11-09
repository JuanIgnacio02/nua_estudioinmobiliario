import { type NextRequest } from "next/server";
import { getStore } from "@/lib/store";
import { findProperty } from "@/lib/properties";
import { ADMIN_COOKIE, isValidToken } from "@/lib/auth";
import { renderPlaca, type PlacaFormat } from "@/lib/placas";
import { SITE_URL } from "@/lib/site";

/**
 * Placa para Instagram de una propiedad (solo admin).
 *   /admin/placas/<slug>?formato=feed|historia&foto=0&descargar=1
 */
export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  // El proxy ya protege /admin; esto es por las dudas.
  if (!(await isValidToken(req.cookies.get(ADMIN_COOKIE)?.value))) {
    return new Response("No autorizado", { status: 401 });
  }
  const { slug } = await params;
  const { properties, settings } = await getStore();
  const p = findProperty(properties, slug);
  if (!p) return new Response("No existe", { status: 404 });

  const q = req.nextUrl.searchParams;
  const format: PlacaFormat = q.get("formato") === "historia" ? "historia" : "feed";
  const foto = Number.parseInt(q.get("foto") ?? "0", 10) || 0;

  const img = await renderPlaca(p, format, foto, SITE_URL, settings.contact.phone);
  const headers = new Headers(img.headers);
  headers.set("Cache-Control", "private, no-store");
  if (q.get("descargar")) {
    headers.set(
      "Content-Disposition",
      `attachment; filename="nua-${slug.slice(0, 50)}-${format}.jpg"`
    );
  }
  return new Response(img.body, { headers });
}
