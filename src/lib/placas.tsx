import "server-only";
import { ImageResponse } from "next/og";
import {
  OPERATION_LABELS,
  TYPE_LABELS,
  formatArea,
  formatPrice,
  placeLabel,
  plural,
  priceDrop,
  propertyImages,
  saleStatus,
  saleStatusLabel,
  type Property,
} from "./properties";
import { asJpeg, brandFonts, logoDataUrl, photoDataUrl } from "./og";

/*
 * Placas para Instagram: la foto de la propiedad con título, precio y datos,
 * con la marca NÚA. Feed 4:5 (1080×1350) e historia 9:16 (1080×1920).
 * En la historia el texto queda lejos de arriba y de abajo, donde Instagram
 * pone su barra y la caja de respuesta.
 */

export type PlacaFormat = "feed" | "historia";

export const PLACA_SIZES: Record<PlacaFormat, { width: number; height: number }> = {
  feed: { width: 1080, height: 1350 },
  historia: { width: 1080, height: 1920 },
};

const BONE = "#f7f6f1";
const MOSS = "#333a17";
const MOSS_DARK = "#24290f";
const SAGE = "#6f7d40";
const INK = "#16180f";

/** "Casa en Fincas del Diamante · Diseño, …" → "Casa en Fincas del Diamante". */
function shortTitle(title: string, max: number) {
  const head = title.split(" · ")[0].split(" | ")[0].trim();
  return head.length > max ? `${head.slice(0, max - 1).trimEnd()}…` : head;
}

function specs(p: Property) {
  return [
    p.coveredArea != null ? `${formatArea(p.coveredArea)} cub.` : null,
    p.semiCoveredArea != null ? `${formatArea(p.semiCoveredArea)} semicub.` : null,
    p.area > 0 ? `${formatArea(p.area)}${p.coveredArea != null ? " terreno" : ""}` : null,
    p.bedrooms != null ? plural(p.bedrooms, "dormitorio", "dormitorios") : null,
    p.bathrooms != null ? plural(p.bathrooms, "baño", "baños") : null,
  ].filter((x): x is string => Boolean(x));
}

export async function renderPlaca(
  p: Property,
  format: PlacaFormat,
  photoIndex: number,
  site: string,
  phone: string
): Promise<Response> {
  const size = PLACA_SIZES[format];
  const story = format === "historia";
  const images = propertyImages(p);
  const src = images[Math.min(Math.max(photoIndex, 0), images.length - 1)] ?? p.image;

  // Proporciones: en el feed la foto ocupa ~65 %; en la historia, ~52 % (abajo
  // quedan ~270 px libres para la caja de respuesta de Instagram).
  const photoH = story ? 1000 : 880;
  const status = saleStatus(p);
  const drop = status === "disponible" ? priceDrop(p) : null;
  const badge =
    status !== "disponible"
      ? saleStatusLabel(p).toUpperCase()
      : drop
        ? `BAJÓ ${drop.pct}%`
        : null;

  const eyebrow = `${OPERATION_LABELS[p.operation]} · ${TYPE_LABELS[p.type]} · ${placeLabel(p.zone, p.city)}`.toUpperCase();
  const title = shortTitle(p.title, story ? 70 : 60);
  const price = formatPrice(p);
  const facts = specs(p);
  const domain = site.replace(/^https?:\/\//, "");
  const cta = "Consultá por WhatsApp";

  const [photo, fonts] = await Promise.all([
    photoDataUrl(src, { width: size.width, height: photoH }, 88),
    brandFonts(eyebrow + title + price + facts.join("") + (badge ?? "") + domain + cta + phone + "EN VENTA ALQUILERNÚA"),
  ]);

  const titleSize = title.length > 42 ? (story ? 60 : 50) : story ? 68 : 58;

  return asJpeg(
    new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            background: BONE,
            fontFamily: "Inter",
          }}
        >
          {/* Foto */}
          <div style={{ position: "relative", display: "flex", width: size.width, height: photoH }}>
            {photo && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photo} width={size.width} height={photoH} alt="" />
            )}
            <div
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                width: size.width,
                height: photoH,
                display: "flex",
                backgroundImage:
                  "linear-gradient(to bottom, rgba(22,24,15,0.5) 0%, rgba(22,24,15,0) 26%)",
              }}
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={logoDataUrl()}
              width={150}
              height={61}
              alt=""
              style={{ position: "absolute", left: 64, top: story ? 230 : 58 }}
            />
            {badge && (
              <div
                style={{
                  position: "absolute",
                  right: 64,
                  top: story ? 238 : 64,
                  display: "flex",
                  padding: "12px 26px",
                  borderRadius: 999,
                  background: status === "vendida" ? "rgba(22,24,15,0.85)" : status === "reservada" ? "#d9a441" : "#b0413e",
                  color: status === "reservada" ? MOSS_DARK : "#ffffff",
                  fontSize: 24,
                  letterSpacing: 3,
                }}
              >
                {badge}
              </div>
            )}
          </div>

          {/* Texto */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              flexGrow: 1,
              padding: story ? "64px 72px 270px" : "52px 72px 50px",
            }}
          >
            <div style={{ fontSize: 22, letterSpacing: 4, color: SAGE }}>{eyebrow}</div>
            <div
              style={{
                marginTop: 18,
                fontSize: titleSize,
                lineHeight: 1.06,
                color: INK,
                fontFamily: "Fraunces",
              }}
            >
              {title}
            </div>
            <div style={{ marginTop: story ? 34 : 26, display: "flex", alignItems: "baseline" }}>
              <div style={{ fontSize: story ? 78 : 66, color: MOSS, fontFamily: "Fraunces" }}>{price}</div>
            </div>
            {facts.length > 0 && (
              <div style={{ marginTop: 14, display: "flex", flexWrap: "wrap", fontSize: 26, color: "#3a3d31" }}>
                {facts.join("  ·  ")}
              </div>
            )}
            <div style={{ flexGrow: 1, display: "flex" }} />
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                borderTop: "2px solid rgba(69,80,33,0.18)",
                paddingTop: 26,
                fontSize: story ? 28 : 24,
              }}
            >
              <div style={{ display: "flex", color: SAGE }}>{story ? cta : domain}</div>
              <div style={{ display: "flex", color: MOSS, fontWeight: 500 }}>{phone}</div>
            </div>
          </div>
        </div>
      ),
      { ...size, fonts }
    ),
    90
  );
}
