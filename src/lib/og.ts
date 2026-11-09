import "server-only";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";
import { LOGO_PATH } from "@/components/Logo";

/**
 * Utilidades para las imágenes que se ven al compartir un link (WhatsApp,
 * Facebook, etc.). Se generan con ImageResponse, que tiene dos limitaciones:
 * solo lee fuentes TTF/OTF/WOFF (no woff2) y no lee imágenes WebP.
 */

export const OG_SIZE = { width: 1200, height: 630 };

/** Verde del isotipo del cliente (círculo de su logo). */
export const BRAND_SAGE = "#899973";

type Font = { name: string; data: ArrayBuffer; weight: 400 | 500; style: "normal" };

/**
 * Fuente de Google Fonts en TTF, recortada a los caracteres usados.
 * Si falla (sin red en el build, etc.) devuelve null y la imagen sale igual
 * con la tipografía por defecto en lugar de romperse.
 */
async function googleFont(
  family: string,
  weight: 400 | 500,
  text: string
): Promise<Font | null> {
  try {
    const css = await (
      await fetch(
        `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@${weight}&text=${encodeURIComponent(text)}`
      )
    ).text();
    const url = css.match(/src: url\((.+?)\) format\('(?:opentype|truetype)'\)/)?.[1];
    if (!url) return null;
    const data = await (await fetch(url)).arrayBuffer();
    return { name: family, data, weight, style: "normal" };
  } catch {
    return null;
  }
}

/** Fraunces (títulos) e Inter (textos chicos), las tipografías del sitio. */
export async function brandFonts(text: string): Promise<Font[]> {
  const fonts = await Promise.all([
    googleFont("Fraunces", 400, text),
    googleFont("Inter", 500, text),
  ]);
  return fonts.filter((f): f is Font => f !== null);
}

/**
 * Foto como JPEG en data URL, recortada al tamaño de la tarjeta.
 * Acepta rutas de /public ("/images/...") o URLs (Cloudinary).
 */
export async function photoDataUrl(src: string): Promise<string | null> {
  try {
    const input = /^https?:\/\//.test(src)
      ? Buffer.from(await (await fetch(src)).arrayBuffer())
      : await readFile(join(process.cwd(), "public", src));
    const jpg = await sharp(input)
      .rotate()
      .resize(OG_SIZE.width, OG_SIZE.height, { fit: "cover" })
      .jpeg({ quality: 82 })
      .toBuffer();
    return `data:image/jpeg;base64,${jpg.toString("base64")}`;
  } catch {
    return null;
  }
}

/**
 * ImageResponse siempre genera PNG, y con una foto pesa 1–1,7 MB: WhatsApp no
 * muestra vistas previas tan pesadas. Se reconvierte a JPEG (~10x más liviano).
 */
export async function asJpeg(image: Response): Promise<Response> {
  const png = Buffer.from(await image.arrayBuffer());
  const jpg = await sharp(png).jpeg({ quality: 80, mozjpeg: true }).toBuffer();
  return new Response(new Uint8Array(jpg), {
    headers: { "Content-Type": "image/jpeg" },
  });
}

/** Wordmark de NÚA en el color pedido, como data URL SVG. */
export function logoDataUrl(color = "#ffffff") {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 69 28"><path fill="${color}" d="${LOGO_PATH}"/></svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}
