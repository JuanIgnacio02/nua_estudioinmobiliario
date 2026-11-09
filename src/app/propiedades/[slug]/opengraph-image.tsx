import { ImageResponse } from "next/og";
import { getStore } from "@/lib/store";
import {
  OPERATION_LABELS,
  TYPE_LABELS,
  findProperty,
  formatArea,
  formatPrice,
  placeLabel,
  publishedProperties,
} from "@/lib/properties";
import { BRAND_SAGE, OG_SIZE, asJpeg, brandFonts, logoDataUrl, photoDataUrl } from "@/lib/og";

/**
 * Lo que se ve al compartir una propiedad por WhatsApp: la foto con título,
 * precio y superficie. Reemplaza al og:image en WebP, que WhatsApp no
 * siempre muestra.
 */

export const alt = "Propiedad en NÚA Estudio Inmobiliario";
export const size = OG_SIZE;
export const contentType = "image/jpeg";
export const revalidate = 3600;

/** "Casa en Fincas del Diamante · Diseño, …" → "Casa en Fincas del Diamante". */
function shortTitle(title: string) {
  const head = title.split(" · ")[0].trim();
  return head.length > 64 ? `${head.slice(0, 61).trimEnd()}…` : head;
}

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { properties } = await getStore();
  const p = findProperty(publishedProperties(properties), slug);

  // Sin propiedad (borrada o en borrador): tarjeta lisa de marca.
  if (!p) {
    return asJpeg(new ImageResponse(
      (
        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: BRAND_SAGE }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logoDataUrl()} width={400} height={162} alt="" />
        </div>
      ),
      size
    ));
  }

  const eyebrow = `${TYPE_LABELS[p.type]} · ${placeLabel(p.zone, p.city)}`.toUpperCase();
  const title = shortTitle(p.title);
  const price = formatPrice(p);
  const area = p.area > 0 ? formatArea(p.area) : "";
  const badge = `EN ${OPERATION_LABELS[p.operation].toUpperCase()}`;

  const [photo, fonts] = await Promise.all([
    photoDataUrl(p.image),
    brandFonts(eyebrow + title + price + area + badge),
  ]);

  return asJpeg(new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", background: "#24290f" }}>
        {photo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo} width={1200} height={630} alt="" style={{ position: "absolute", left: 0, top: 0 }} />
        )}
        {/* Degradado para que el texto se lea sobre cualquier foto */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: 1200,
            height: 630,
            display: "flex",
            backgroundImage:
              "linear-gradient(to top, rgba(22,24,15,0.92) 0%, rgba(22,24,15,0.6) 38%, rgba(22,24,15,0) 66%), linear-gradient(to bottom, rgba(22,24,15,0.45) 0%, rgba(22,24,15,0) 22%)",
          }}
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoDataUrl()} width={136} height={55} alt="" style={{ position: "absolute", top: 44, left: 56 }} />
        <div
          style={{
            position: "absolute",
            top: 46,
            right: 56,
            display: "flex",
            padding: "10px 20px",
            borderRadius: 999,
            background: "rgba(235,239,225,0.92)",
            color: "#333a17",
            fontSize: 18,
            letterSpacing: 3,
            fontFamily: "Inter",
          }}
        >
          {badge}
        </div>
        <div style={{ position: "absolute", left: 56, right: 56, bottom: 50, display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 20, letterSpacing: 5, color: "#d6dbc7", fontFamily: "Inter" }}>{eyebrow}</div>
          <div style={{ marginTop: 14, fontSize: 60, lineHeight: 1.05, color: "#ffffff", fontFamily: "Fraunces" }}>{title}</div>
          <div style={{ marginTop: 22, display: "flex", alignItems: "baseline" }}>
            <div style={{ fontSize: 46, color: "#ffffff", fontFamily: "Fraunces" }}>{price}</div>
            {area && (
              <div style={{ marginLeft: 26, fontSize: 26, color: "#d6dbc7", fontFamily: "Inter" }}>{area}</div>
            )}
          </div>
        </div>
      </div>
    ),
    { ...size, fonts }
  ));
}
