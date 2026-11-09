import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { BRAND_SAGE, OG_SIZE, brandFonts, logoDataUrl } from "@/lib/og";

/**
 * Tarjeta por defecto al compartir cualquier página del sitio. Replica la
 * composición del isotipo del cliente (núa + "estudio inmobiliario" sobre el
 * verde de marca) con el callejero de San Rafael de fondo.
 */

export const alt = "NÚA Estudio Inmobiliario — San Rafael, Mendoza";
export const size = OG_SIZE;
export const contentType = "image/png";

const SUBTITLE = "estudio inmobiliario";
const PLACE = "SAN RAFAEL · MENDOZA";

async function streetsDataUrl() {
  try {
    const svg = await readFile(
      join(process.cwd(), "public/images/mapa-san-rafael.svg"),
      "utf8"
    );
    // El SVG viene en verde para el menú; acá las calles van en blanco.
    const white = svg.replace(/stroke="#[0-9a-fA-F]{6}"/, 'stroke="#ffffff"');
    return `data:image/svg+xml;base64,${Buffer.from(white).toString("base64")}`;
  } catch {
    return null;
  }
}

export default async function Image() {
  const [fonts, streets] = await Promise.all([
    brandFonts(SUBTITLE + PLACE),
    streetsDataUrl(),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          background: BRAND_SAGE,
        }}
      >
        {streets && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={streets}
            width={1300}
            height={1100}
            alt=""
            style={{ position: "absolute", left: -50, top: -235, opacity: 0.16 }}
          />
        )}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: 1200,
            height: 630,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logoDataUrl()} width={400} height={162} alt="" />
          <div
            style={{
              marginTop: 26,
              fontSize: 38,
              color: "#ffffff",
              fontFamily: "Inter",
              letterSpacing: 2,
            }}
          >
            {SUBTITLE}
          </div>
        </div>
        <div
          style={{
            position: "absolute",
            bottom: 46,
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "center",
            fontSize: 20,
            letterSpacing: 6,
            color: "rgba(255,255,255,0.85)",
            fontFamily: "Inter",
          }}
        >
          {PLACE}
        </div>
      </div>
    ),
    { ...size, fonts }
  );
}
