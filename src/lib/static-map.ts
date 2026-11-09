import "server-only";
import sharp from "sharp";
import type { LatLng } from "./geo";

/*
 * Mapa fijo (una imagen) para la ficha en PDF: satélite de Esri con los
 * nombres de las calles encima, y el pin o el contorno del terreno.
 * Se arma pegando las baldosas (tiles) de 256 px que usa el mapa del sitio.
 */

const TILE = 256;
const SAT =
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
const LABELS =
  "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}";
/** En San Rafael la imagen satelital real llega hasta z17. */
const MAX_ZOOM = 17;

function project([lat, lng]: LatLng, z: number): [number, number] {
  const world = TILE * 2 ** z;
  const s = Math.sin((lat * Math.PI) / 180);
  return [
    ((lng + 180) / 360) * world,
    (0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)) * world,
  ];
}

async function tile(url: string): Promise<Buffer | null> {
  try {
    const res = await fetch(url, {
      cache: "force-cache",
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return null;
    return Buffer.from(await res.arrayBuffer());
  } catch {
    return null;
  }
}

/** Zoom más cercano en el que el terreno entra con aire alrededor. */
function fitZoom(points: LatLng[], width: number, height: number) {
  for (let z = MAX_ZOOM; z >= 12; z--) {
    const px = points.map((p) => project(p, z));
    const w = Math.max(...px.map((p) => p[0])) - Math.min(...px.map((p) => p[0]));
    const h = Math.max(...px.map((p) => p[1])) - Math.min(...px.map((p) => p[1]));
    if (w <= width * 0.6 && h <= height * 0.6) return z;
  }
  return 12;
}

export async function staticMap({
  center,
  boundary,
  width = 1000,
  height = 560,
}: {
  center: LatLng;
  boundary?: LatLng[];
  width?: number;
  height?: number;
}): Promise<Buffer | null> {
  const hasShape = Boolean(boundary && boundary.length >= 3);
  // Sin terreno: z17, se ve la manzana y las calles de alrededor.
  const z = hasShape ? fitZoom(boundary as LatLng[], width, height) : MAX_ZOOM;
  // Centro: el del terreno si hay, si no el pin.
  const focus: LatLng = hasShape
    ? [
        (Math.max(...boundary!.map((p) => p[0])) + Math.min(...boundary!.map((p) => p[0]))) / 2,
        (Math.max(...boundary!.map((p) => p[1])) + Math.min(...boundary!.map((p) => p[1]))) / 2,
      ]
    : center;
  const [cx, cy] = project(focus, z);
  const left = cx - width / 2;
  const top = cy - height / 2;
  const x0 = Math.floor(left / TILE);
  const y0 = Math.floor(top / TILE);
  const x1 = Math.floor((left + width) / TILE);
  const y1 = Math.floor((top + height) / TILE);

  const jobs: Promise<sharp.OverlayOptions[]>[] = [];
  for (let x = x0; x <= x1; x++) {
    for (let y = y0; y <= y1; y++) {
      const fill = (u: string) => u.replace("{z}", String(z)).replace("{x}", String(x)).replace("{y}", String(y));
      const pos = { left: (x - x0) * TILE, top: (y - y0) * TILE };
      jobs.push(
        Promise.all([tile(fill(SAT)), tile(fill(LABELS))]).then(([sat, lab]) =>
          [sat, lab].filter((b): b is Buffer => b !== null).map((input) => ({ input, ...pos }))
        )
      );
    }
  }
  const layers = (await Promise.all(jobs)).flat();
  if (layers.length === 0) return null;

  const mosaic = await sharp({
    create: {
      width: (x1 - x0 + 1) * TILE,
      height: (y1 - y0 + 1) * TILE,
      channels: 3,
      background: "#d6dbc7",
    },
  })
    .composite(layers)
    .png()
    .toBuffer();

  const offX = Math.round(left - x0 * TILE);
  const offY = Math.round(top - y0 * TILE);
  const cropped = await sharp(mosaic)
    .extract({ left: offX, top: offY, width, height })
    .toBuffer();

  // Encima: el contorno del terreno o un pin con los colores de NÚA.
  const toPx = (p: LatLng) => {
    const [x, y] = project(p, z);
    return [x - left, y - top];
  };
  let overlay: string;
  if (hasShape) {
    const pts = boundary!.map(toPx).map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
    overlay = `<polygon points="${pts}" fill="rgba(172,178,151,0.35)" stroke="#ebefe1" stroke-width="4" stroke-linejoin="round"/>
      <polygon points="${pts}" fill="none" stroke="#455021" stroke-width="2" stroke-linejoin="round"/>`;
  } else {
    const [x, y] = toPx(center);
    overlay = `<g transform="translate(${x.toFixed(1)},${y.toFixed(1)})">
      <ellipse cx="0" cy="2" rx="9" ry="4" fill="rgba(0,0,0,0.35)"/>
      <path d="M0 0 C -6 -14 -20 -22 -20 -38 A 20 20 0 1 1 20 -38 C 20 -22 6 -14 0 0 Z" fill="#455021" stroke="#ffffff" stroke-width="3"/>
      <circle cx="0" cy="-38" r="7" fill="#ebefe1"/>
    </g>`;
  }
  const svg = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">${overlay}</svg>`
  );

  return sharp(cropped)
    .composite([{ input: svg, left: 0, top: 0 }])
    .jpeg({ quality: 82, mozjpeg: true })
    .toBuffer();
}
