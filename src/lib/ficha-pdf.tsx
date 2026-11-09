import "server-only";
import {
  Document,
  Font,
  Image,
  Link,
  Page,
  Path,
  StyleSheet,
  Svg,
  Text,
  View,
  renderToBuffer,
} from "@react-pdf/renderer";
import QRCode from "qrcode";
import { LOGO_PATH } from "@/components/Logo";
import {
  OPERATION_LABELS,
  TYPE_LABELS,
  formatPrice,
  paragraphs,
  placeLabel,
  priceDrop,
  propertyImages,
  saleStatus,
  saleStatusLabel,
  type Property,
  type SiteSettings,
} from "./properties";
import { centroid } from "./geo";
import { photoJpeg } from "./og";
import { staticMap } from "./static-map";

/*
 * Ficha de la propiedad en PDF (A4): para mandar por mail o imprimir para una
 * visita. Texto real (se puede seleccionar y se ve nítido), fotos, mapa con
 * el terreno, datos de contacto y un QR a la ficha online.
 */

const C = {
  bone: "#f7f6f1",
  mint: "#ebefe1",
  moss: "#333a17",
  moss600: "#455021",
  sage: "#6f7d40",
  ink: "#16180f",
  soft: "#3a3d31",
  line: "#dfe2d3",
  red: "#b0413e",
  amber: "#d9a441",
};

/* -------------------------- Tipografías -------------------------- */

let fontsReady: Promise<boolean> | null = null;

/** URLs TTF de Google Fonts (las mismas tipografías del sitio). */
async function ttfUrls(family: string, weights: number[]) {
  const css = await (
    await fetch(
      `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@${weights.join(";")}`,
      { cache: "force-cache" }
    )
  ).text();
  const out: { src: string; fontWeight: number }[] = [];
  for (const block of css.split("@font-face").slice(1)) {
    const w = Number(block.match(/font-weight:\s*(\d+)/)?.[1]);
    const src = block.match(/src: url\((.+?)\) format\('(?:truetype|opentype)'\)/)?.[1];
    if (w && src) out.push({ src, fontWeight: w });
  }
  return out;
}

function ensureFonts() {
  fontsReady ??= (async () => {
    try {
      const [fraunces, inter] = await Promise.all([
        ttfUrls("Fraunces", [400]),
        ttfUrls("Inter", [400, 500, 600]),
      ]);
      if (!fraunces.length || !inter.length) return false;
      Font.register({ family: "Fraunces", fonts: fraunces });
      Font.register({ family: "Inter", fonts: inter });
      // Sin cortar palabras con guiones (el corte automático es en inglés).
      Font.registerHyphenationCallback((word) => [word]);
      return true;
    } catch {
      fontsReady = null;
      return false;
    }
  })();
  return fontsReady;
}

/* ----------------------------- Estilos ----------------------------- */

function makeStyles(serif: string, sans: string) {
  return StyleSheet.create({
    page: {
      paddingTop: 36,
      paddingBottom: 56,
      paddingHorizontal: 40,
      backgroundColor: "#ffffff",
      fontFamily: sans,
      fontSize: 10,
      color: C.soft,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 18,
    },
    headerText: { fontSize: 8, letterSpacing: 1.5, color: C.sage, textTransform: "uppercase" },
    hero: { width: "100%", height: 290, borderRadius: 8, objectFit: "cover" },
    eyebrow: { marginTop: 18, fontSize: 8, letterSpacing: 2, color: C.sage, textTransform: "uppercase" },
    title: { marginTop: 6, fontFamily: serif, fontSize: 22, lineHeight: 1.15, color: C.ink },
    address: { marginTop: 4, fontSize: 10, color: C.soft },
    priceRow: { marginTop: 12, flexDirection: "row", alignItems: "center" },
    price: { fontFamily: serif, fontSize: 24, color: C.moss600 },
    oldPrice: { marginLeft: 10, fontSize: 10, color: "#8a8d80", textDecoration: "line-through" },
    badge: {
      marginLeft: 10,
      paddingVertical: 3,
      paddingHorizontal: 8,
      borderRadius: 10,
      fontSize: 7.5,
      letterSpacing: 1,
      fontWeight: 600,
      color: "#ffffff",
    },
    stats: {
      marginTop: 16,
      flexDirection: "row",
      borderTopWidth: 1,
      borderBottomWidth: 1,
      borderColor: C.line,
      paddingVertical: 10,
    },
    stat: { flex: 1, paddingHorizontal: 6 },
    statValue: { fontFamily: serif, fontSize: 16, color: C.ink },
    statLabel: { marginTop: 2, fontSize: 7, letterSpacing: 1.2, color: C.sage, textTransform: "uppercase" },
    sectionTitle: {
      marginTop: 22,
      marginBottom: 8,
      fontSize: 8,
      letterSpacing: 2,
      color: C.sage,
      textTransform: "uppercase",
    },
    lead: { fontFamily: serif, fontSize: 13, lineHeight: 1.45, color: C.ink },
    para: { marginTop: 6, fontSize: 10, lineHeight: 1.55 },
    features: { flexDirection: "row", flexWrap: "wrap" },
    feature: { width: "33.33%", flexDirection: "row", alignItems: "center", marginBottom: 6 },
    dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: C.sage, marginRight: 6 },
    gallery: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: -4 },
    thumb: { width: "33.33%", padding: 4 },
    thumbImg: { width: "100%", height: 100, borderRadius: 5, objectFit: "cover" },
    map: { width: "100%", height: 240, borderRadius: 8, objectFit: "cover" },
    mapCaption: { marginTop: 4, flexDirection: "row", justifyContent: "space-between", fontSize: 7, color: "#8a8d80" },
    link: { color: C.moss600, textDecoration: "none" },
    contact: {
      marginTop: 22,
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: C.mint,
      borderRadius: 10,
      padding: 16,
    },
    contactTitle: { fontFamily: serif, fontSize: 16, color: C.ink },
    contactLine: { marginTop: 4, fontSize: 10, color: C.soft },
    qr: { width: 74, height: 74, marginLeft: 16 },
    qrNote: { marginTop: 4, fontSize: 6.5, color: C.sage, textAlign: "center" },
    footer: {
      position: "absolute",
      left: 40,
      right: 40,
      bottom: 24,
      flexDirection: "row",
      justifyContent: "space-between",
      borderTopWidth: 1,
      borderColor: C.line,
      paddingTop: 8,
      fontSize: 7.5,
      color: "#8a8d80",
    },
  });
}

function Logo({ width, color }: { width: number; color: string }) {
  return (
    <Svg viewBox="0 0 69 28" style={{ width, height: (width * 28) / 69 }}>
      <Path d={LOGO_PATH} fill={color} />
    </Svg>
  );
}

/* ----------------------------- Documento ----------------------------- */

export async function renderFichaPdf(
  p: Property,
  contact: SiteSettings["contact"],
  site: string
): Promise<Buffer> {
  const fontsOk = await ensureFonts();
  const serif = fontsOk ? "Fraunces" : "Times-Roman";
  const sans = fontsOk ? "Inter" : "Helvetica";
  const s = makeStyles(serif, sans);

  const url = `${site}/propiedades/${p.slug}`;
  const imgs = propertyImages(p);
  const hasShape = Boolean(p.boundary && p.boundary.length >= 3);
  const center = p.coords ?? (hasShape ? centroid(p.boundary!) : null);

  // Todo en paralelo: foto principal, galería, mapa y QR.
  const [hero, gallery, map, qr] = await Promise.all([
    imgs[0] ? photoJpeg(imgs[0], { width: 1600, height: 900 }, 80) : null,
    Promise.all(imgs.slice(1, 7).map((src) => photoJpeg(src, { width: 600, height: 400 }, 72))),
    center ? staticMap({ center, boundary: hasShape ? p.boundary : undefined }) : null,
    QRCode.toBuffer(url, { margin: 0, width: 300, color: { dark: C.moss, light: "#ffffff" } }),
  ]);
  const thumbs = gallery.filter((b): b is Buffer => b !== null);

  const status = saleStatus(p);
  const drop = status === "disponible" ? priceDrop(p) : null;
  const stats = [
    p.bedrooms != null ? { v: String(p.bedrooms), l: "Dormitorios" } : null,
    p.bathrooms != null ? { v: String(p.bathrooms), l: "Baños" } : null,
    p.coveredArea != null ? { v: p.coveredArea.toLocaleString("es-AR"), l: "m² cubiertos" } : null,
    p.area > 0 ? { v: p.area.toLocaleString("es-AR"), l: p.coveredArea != null ? "m² terreno" : "m² totales" } : null,
  ].filter((x): x is { v: string; l: string } => x !== null);
  // Sin repetidos: suele haber lo mismo en amenities y en destacados.
  const features = [
    ...new Map(
      [...p.services, ...(p.amenities ?? []), ...(p.highlights ?? [])].map((f) => [
        f.trim().toLowerCase(),
        f.trim(),
      ])
    ).values(),
  ].filter(Boolean);
  const paras = paragraphs(p.description);
  const mapsLink = center
    ? `https://www.google.com/maps/search/?api=1&query=${center[0]},${center[1]}`
    : null;

  const doc = (
    <Document
      title={`${p.title} · NÚA Estudio Inmobiliario`}
      author="NÚA Estudio Inmobiliario"
      subject={`${OPERATION_LABELS[p.operation]} · ${TYPE_LABELS[p.type]}`}
      language="es-AR"
    >
      <Page size="A4" style={s.page}>
        <View style={s.header} fixed>
          <Logo width={64} color={C.moss600} />
          <Text style={s.headerText}>Estudio Inmobiliario · San Rafael, Mendoza</Text>
        </View>

        {/* eslint-disable-next-line jsx-a11y/alt-text */}
        {hero && <Image src={{ data: hero, format: "jpg" }} style={s.hero} />}

        <Text style={s.eyebrow}>
          {OPERATION_LABELS[p.operation]} · {TYPE_LABELS[p.type]} · {placeLabel(p.zone, p.city)}
        </Text>
        <Text style={s.title}>{p.title}</Text>
        {p.location ? <Text style={s.address}>{p.location}</Text> : null}

        <View style={s.priceRow}>
          <Text style={status === "vendida" ? [s.price, { color: "#8a8d80", textDecoration: "line-through" }] : s.price}>
            {formatPrice(p)}
          </Text>
          {drop && <Text style={s.oldPrice}>{formatPrice({ ...p, price: drop.from })}</Text>}
          {status !== "disponible" ? (
            <Text style={[s.badge, { backgroundColor: status === "vendida" ? C.ink : C.amber, color: status === "vendida" ? "#ffffff" : C.moss }]}>
              {saleStatusLabel(p).toUpperCase()}
            </Text>
          ) : drop ? (
            <Text style={[s.badge, { backgroundColor: C.red }]}>BAJÓ {drop.pct}%</Text>
          ) : null}
        </View>

        {stats.length > 0 && (
          <View style={s.stats}>
            {stats.map((st) => (
              <View key={st.l} style={s.stat}>
                <Text style={s.statValue}>{st.v}</Text>
                <Text style={s.statLabel}>{st.l}</Text>
              </View>
            ))}
          </View>
        )}

        {paras.length > 0 && (
          <View>
            <Text style={s.sectionTitle}>Descripción</Text>
            {paras.map((t, i) => (
              <Text key={i} style={i === 0 ? s.lead : s.para}>
                {t}
              </Text>
            ))}
          </View>
        )}

        {features.length > 0 && (
          <View wrap={false}>
            <Text style={s.sectionTitle}>Características</Text>
            <View style={s.features}>
              {features.map((f) => (
                <View key={f} style={s.feature}>
                  <View style={s.dot} />
                  <Text>{f}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {thumbs.length > 0 && (
          <View wrap={false}>
            <Text style={s.sectionTitle}>Fotos</Text>
            <View style={s.gallery}>
              {thumbs.map((b, i) => (
                <View key={i} style={s.thumb}>
                  {/* eslint-disable-next-line jsx-a11y/alt-text */}
                  <Image src={{ data: b, format: "jpg" }} style={s.thumbImg} />
                </View>
              ))}
            </View>
          </View>
        )}

        {map && (
          <View wrap={false}>
            <Text style={s.sectionTitle}>{hasShape ? "Ubicación y terreno" : "Ubicación"}</Text>
            {/* eslint-disable-next-line jsx-a11y/alt-text */}
            <Image src={{ data: map, format: "jpg" }} style={s.map} />
            <View style={s.mapCaption}>
              <Text>Imagen © Esri, Maxar, Earthstar Geographics</Text>
              {mapsLink && (
                <Link src={mapsLink} style={s.link}>
                  Abrir en Google Maps
                </Link>
              )}
            </View>
          </View>
        )}

        <View style={s.contact} wrap={false}>
          <View style={{ flex: 1 }}>
            <Text style={s.contactTitle}>¿Te interesa esta propiedad?</Text>
            <Text style={s.contactLine}>
              WhatsApp:{" "}
              <Link src={`https://wa.me/${contact.phoneHref}`} style={s.link}>
                {contact.phone}
              </Link>
            </Text>
            <Text style={s.contactLine}>
              Email:{" "}
              <Link src={`mailto:${contact.email}`} style={s.link}>
                {contact.email}
              </Link>
            </Text>
            <Text style={s.contactLine}>
              Ficha online, con todas las fotos:{" "}
              {/* La URL completa es muy larga y se salía del recuadro. */}
              <Link src={url} style={s.link}>
                abrir en la web
              </Link>
            </Text>
          </View>
          <View>
            {/* eslint-disable-next-line jsx-a11y/alt-text */}
            <Image src={{ data: qr, format: "png" }} style={s.qr} />
            <Text style={s.qrNote}>Ver online</Text>
          </View>
        </View>

        <View style={s.footer} fixed>
          <Text>NÚA Estudio Inmobiliario · {site.replace(/^https?:\/\//, "")}</Text>
          <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );

  return renderToBuffer(doc);
}
