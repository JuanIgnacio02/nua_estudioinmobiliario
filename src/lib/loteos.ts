/**
 * Loteos — desarrollos con múltiples lotes dibujados sobre el satélite.
 *
 * Un `Loteo` es un emprendimiento (barrio, loteo, subdivisión) con un
 * `master plan` interactivo: la vista satelital con TODOS los lotes dibujados
 * y coloreados por estado. Cada `Lot` es un polígono con su número, m², precio
 * y estado (disponible / reservado / vendido).
 *
 * Se persiste en el mismo store JSONB que las propiedades (ver store.ts), así
 * que sumar loteos no requiere migración de schema.
 */

export type LotStatus = "disponible" | "reservado" | "vendido";

export type Lot = {
  /** Identificador visible: "12", "A-3", etc. */
  number: string;
  /** Contorno del lote: lista de vértices [lat, lng]. */
  boundary: [number, number][];
  /** Superficie en m² (se autocalcula al dibujar, editable). */
  area: number;
  /** Precio en USD. Omitido/0 = "consultar". */
  price?: number;
  status: LotStatus;
};

export type Loteo = {
  slug: string;
  title: string;
  /** Dirección / referencia legible. */
  location: string;
  /** Barrio o localidad. */
  zone: string;
  city: string;
  /** Centro del master plan [lat, lng]. */
  coords: [number, number];
  /** Imagen de portada para el listado. */
  image?: string;
  description?: string;
  lots: Lot[];
};

/* ------------------------------ estados ------------------------------ */

export const LOT_STATUS_LABELS: Record<LotStatus, string> = {
  disponible: "Disponible",
  reservado: "Reservado",
  vendido: "Vendido",
};

/** Colores por estado, usados directo en Leaflet (stroke / fill). */
export const LOT_STATUS_COLORS: Record<
  LotStatus,
  { stroke: string; fill: string }
> = {
  // Disponible = verde NÚA (celadon-400 / moss-600)
  disponible: { stroke: "#455021", fill: "#acb297" },
  // Reservado = ámbar
  reservado: { stroke: "#9a6a12", fill: "#d9a441" },
  // Vendido = gris apagado
  vendido: { stroke: "#5c5f57", fill: "#9a9d94" },
};

/* ------------------------------ helpers ------------------------------ */

export function findLoteo(list: Loteo[], slug: string): Loteo | undefined {
  return list.find((l) => l.slug === slug);
}

export type LoteoStats = {
  total: number;
  disponible: number;
  reservado: number;
  vendido: number;
  /** Precio mínimo entre lotes disponibles con precio (USD). */
  desde?: number;
};

export function loteoStats(loteo: Loteo): LoteoStats {
  const s: LoteoStats = {
    total: loteo.lots.length,
    disponible: 0,
    reservado: 0,
    vendido: 0,
  };
  const precios: number[] = [];
  for (const lot of loteo.lots) {
    s[lot.status] += 1;
    if (lot.status === "disponible" && lot.price && lot.price > 0) {
      precios.push(lot.price);
    }
  }
  if (precios.length) s.desde = Math.min(...precios);
  return s;
}

/** Área en m² de un polígono (plano local, suficiente para lotes urbanos). */
export function polygonAreaM2(pts: [number, number][]): number {
  if (pts.length < 3) return 0;
  const lat0 = pts[0][0];
  const mPerDegLat = 111320;
  const mPerDegLng = 111320 * Math.cos((lat0 * Math.PI) / 180);
  const xy = pts.map(([la, ln]) => [ln * mPerDegLng, la * mPerDegLat]);
  let acc = 0;
  for (let i = 0; i < xy.length; i++) {
    const [x1, y1] = xy[i];
    const [x2, y2] = xy[(i + 1) % xy.length];
    acc += x1 * y2 - x2 * y1;
  }
  return Math.round(Math.abs(acc) / 2);
}

/* ------------------------------- seed -------------------------------- */

/** Genera una grilla de lotes rectangulares alrededor de un centro (para el seed). */
function seedGrid(
  center: [number, number],
  cols: number,
  rows: number,
  lotW = 15, // metros de frente
  lotD = 27 // metros de fondo
): Lot[] {
  const [lat, lng] = center;
  const mPerDegLat = 111320;
  const mPerDegLng = 111320 * Math.cos((lat * Math.PI) / 180);
  const gap = 0; // calles se ven en el satélite; sin gap el polígono es el lote
  const totalW = cols * lotW;
  const totalD = rows * lotD;
  const lots: Lot[] = [];
  let n = 1;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      // esquina inferior-izquierda del lote, en metros relativos al centro
      const x0 = c * (lotW + gap) - totalW / 2;
      const y0 = r * (lotD + gap) - totalD / 2;
      const corners: [number, number][] = [
        [x0, y0],
        [x0 + lotW, y0],
        [x0 + lotW, y0 + lotD],
        [x0, y0 + lotD],
      ].map(
        ([x, y]) =>
          [lat + y / mPerDegLat, lng + x / mPerDegLng] as [number, number]
      );
      const status: LotStatus =
        n % 7 === 0 ? "vendido" : n % 5 === 0 ? "reservado" : "disponible";
      lots.push({
        number: String(n),
        boundary: corners,
        area: lotW * lotD,
        price: status === "vendido" ? undefined : 32000 + (n % 4) * 3000,
        status,
      });
      n++;
    }
  }
  return lots;
}

export const seedLoteos: Loteo[] = [
  {
    slug: "loteo-portal-del-diamante",
    title: "Loteo Portal del Diamante",
    location: "Patricias Mendocinas 3111 — Periurbano",
    zone: "Periurbano",
    city: "San Rafael",
    coords: [-34.602, -68.355],
    description:
      "Desarrollo residencial a 12 minutos del centro de San Rafael. Lotes urbanizados con calles internas, listos para construir. Elegí tu lote directamente sobre el plano satelital.",
    lots: seedGrid([-34.602, -68.355], 5, 3),
  },
];
