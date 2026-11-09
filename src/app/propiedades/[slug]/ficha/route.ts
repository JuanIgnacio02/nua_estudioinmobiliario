import { type NextRequest } from "next/server";
import { getStore } from "@/lib/store";
import { findProperty } from "@/lib/properties";
import { ADMIN_COOKIE, isValidToken } from "@/lib/auth";
import { renderFichaPdf } from "@/lib/ficha-pdf";
import { SITE_URL } from "@/lib/site";

/**
 * Ficha de la propiedad en PDF: /propiedades/<slug>/ficha
 * Pública para las publicadas; los borradores solo con sesión de admin.
 * Con ?descargar=1 se baja como archivo; si no, se abre en el navegador.
 */
export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const { properties, settings } = await getStore();
  const p = findProperty(properties, slug);
  if (!p) return new Response("No existe", { status: 404 });
  const admin = await isValidToken(req.cookies.get(ADMIN_COOKIE)?.value);
  if (p.draft && !admin) return new Response("No existe", { status: 404 });

  const pdf = await renderFichaPdf(p, settings.contact, SITE_URL);
  const name = `NUA-${slug.slice(0, 60)}.pdf`;
  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${req.nextUrl.searchParams.get("descargar") ? "attachment" : "inline"}; filename="${name}"`,
      // Las publicadas se guardan 10 min en la CDN; los borradores, nunca.
      "Cache-Control": p.draft
        ? "private, no-store"
        : "public, s-maxage=600, stale-while-revalidate=86400",
      "X-Robots-Tag": "noindex",
    },
  });
}
