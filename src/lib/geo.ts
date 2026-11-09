/**
 * Geometría de terrenos sobre el mapa.
 *
 * Para lotes y fincas alcanza con una proyección plana local (equirectangular
 * alrededor de un punto): el error es de centímetros en cientos de metros.
 * Convención: x = este, y = norte, en metros.
 */

export type LatLng = [number, number];

const M_PER_DEG_LAT = 111_320;

function mPerDegLng(lat: number) {
  return M_PER_DEG_LAT * Math.cos((lat * Math.PI) / 180);
}

/** Punto → metros (este, norte) respecto de `origin`. */
export function toXY(p: LatLng, origin: LatLng): [number, number] {
  return [(p[1] - origin[1]) * mPerDegLng(origin[0]), (p[0] - origin[0]) * M_PER_DEG_LAT];
}

/** Metros (este, norte) respecto de `origin` → punto. */
export function fromXY([x, y]: [number, number], origin: LatLng): LatLng {
  return [origin[0] + y / M_PER_DEG_LAT, origin[1] + x / mPerDegLng(origin[0])];
}

export function distanceM(a: LatLng, b: LatLng) {
  const [x, y] = toXY(b, a);
  return Math.hypot(x, y);
}

export function midpoint(a: LatLng, b: LatLng): LatLng {
  return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
}

export function centroid(pts: LatLng[]): LatLng {
  const n = pts.length || 1;
  return [pts.reduce((s, p) => s + p[0], 0) / n, pts.reduce((s, p) => s + p[1], 0) / n];
}

/** Área en m² (fórmula del lazo sobre el plano local). */
export function areaM2(pts: LatLng[]): number {
  if (pts.length < 3) return 0;
  const o = pts[0];
  const xy = pts.map((p) => toXY(p, o));
  let acc = 0;
  for (let i = 0; i < xy.length; i++) {
    const [x1, y1] = xy[i];
    const [x2, y2] = xy[(i + 1) % xy.length];
    acc += x1 * y2 - x2 * y1;
  }
  return Math.abs(acc) / 2;
}

/** Largo de cada lado, en metros (lado i = del punto i al i+1). */
export function edgeLengths(pts: LatLng[]): number[] {
  return pts.map((p, i) => distanceM(p, pts[(i + 1) % pts.length]));
}

/** "12 m" / "12,5 m": medidas como las escribe un plano. */
export function formatMeters(m: number) {
  const r = Math.round(m * 10) / 10;
  return `${r.toLocaleString("es-AR", { maximumFractionDigits: r >= 100 ? 0 : 1 })} m`;
}

/* --------------------------- Rectángulos --------------------------- */

/**
 * Terreno rectangular: centro, frente (ancho), fondo (largo) y giro.
 * `angle` en grados, antihorario: 0° = el frente corre de oeste a este y mira
 * al sur. El "frente" es el lado que da a la calle.
 */
export type Rect = {
  center: LatLng;
  width: number;
  depth: number;
  angle: number;
};

function rotate([x, y]: [number, number], deg: number): [number, number] {
  const a = (deg * Math.PI) / 180;
  return [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)];
}

/**
 * Esquinas del rectángulo, empezando por las dos del frente
 * (frente-izquierda, frente-derecha, fondo-derecha, fondo-izquierda).
 */
export function rectCorners(r: Rect): LatLng[] {
  const hw = r.width / 2;
  const hd = r.depth / 2;
  const local: [number, number][] = [
    [-hw, -hd],
    [hw, -hd],
    [hw, hd],
    [-hw, hd],
  ];
  return local.map((p) => fromXY(rotate(p, r.angle), r.center));
}

/** Punto a `meters` por delante del frente, sobre su mitad (manija de giro). */
export function rectFrontHandle(r: Rect, meters: number): LatLng {
  return fromXY(rotate([0, -(r.depth / 2 + meters)], r.angle), r.center);
}

/** Ángulo para que el frente quede mirando hacia `target`. */
export function angleFacing(center: LatLng, target: LatLng): number {
  const [x, y] = toXY(target, center);
  // El frente mira hacia (0,-1) local; girado θ queda en (sin θ, -cos θ).
  return normAngle((Math.atan2(x, -y) * 180) / Math.PI);
}

export function normAngle(deg: number) {
  return ((deg % 360) + 360) % 360;
}

/**
 * Si los 4 puntos forman (casi) un rectángulo, devuelve sus medidas para
 * poder seguir editándolo como rectángulo. Si no, null.
 */
export function rectFromCorners(pts: LatLng[]): Rect | null {
  if (pts.length !== 4) return null;
  const c = centroid(pts);
  const xy = pts.map((p) => toXY(p, c));
  const sides = xy.map((p, i) => {
    const q = xy[(i + 1) % 4];
    return [q[0] - p[0], q[1] - p[1]] as [number, number];
  });
  const len = sides.map(([x, y]) => Math.hypot(x, y));
  if (len.some((l) => l < 0.5)) return null;
  // Lados opuestos iguales (±3 %) y ángulos rectos (±3°).
  if (Math.abs(len[0] - len[2]) > 0.03 * len[0] || Math.abs(len[1] - len[3]) > 0.03 * len[1]) {
    return null;
  }
  for (let i = 0; i < 4; i++) {
    const [ax, ay] = sides[i];
    const [bx, by] = sides[(i + 1) % 4];
    const cos = (ax * bx + ay * by) / (len[i] * len[(i + 1) % 4]);
    if (Math.abs(cos) > 0.052) return null;
  }
  // El lado 0 (puntos 0→1) es el frente.
  const angle = normAngle((Math.atan2(sides[0][1], sides[0][0]) * 180) / Math.PI);
  return {
    center: c,
    width: (len[0] + len[2]) / 2,
    depth: (len[1] + len[3]) / 2,
    angle,
  };
}

/** Rectángulo pegado al lado derecho (+1) o izquierdo (-1) de otro: el lote vecino. */
export function rectBeside(r: Rect, side: 1 | -1): Rect {
  const shift = rotate([side * r.width, 0], r.angle);
  const [cx, cy] = shift;
  return { ...r, center: fromXY([cx, cy], r.center) };
}

/** Rectángulo pegado atrás (+1) o adelante (-1): lotes espalda con espalda. */
export function rectBehind(r: Rect, side: 1 | -1): Rect {
  const shift = rotate([0, side * r.depth], r.angle);
  return { ...r, center: fromXY(shift, r.center) };
}

/* ------------------------- Calle más cercana ------------------------ */

export type StreetHint = { point: LatLng; along: number; distance: number };

/**
 * Punto más cercano a `p` sobre un conjunto de líneas (la calle), con la
 * dirección del tramo y la distancia. Sirve para que el terreno aparezca ya
 * alineado con su calle.
 */
export function nearestOnLines(p: LatLng, lines: LatLng[][]): StreetHint | null {
  let best: { d: number; pt: [number, number]; dir: [number, number] } | null = null;
  for (const line of lines) {
    for (let i = 0; i + 1 < line.length; i++) {
      const a = toXY(line[i], p);
      const b = toXY(line[i + 1], p);
      // Punto del tramo a-b más cercano al pin (que está en el origen).
      const dx = b[0] - a[0];
      const dy = b[1] - a[1];
      const l2 = dx * dx + dy * dy;
      if (l2 < 1) continue;
      const t = Math.max(0, Math.min(1, -(a[0] * dx + a[1] * dy) / l2));
      const q: [number, number] = [a[0] + t * dx, a[1] + t * dy];
      const d = Math.hypot(q[0], q[1]);
      if (!best || d < best.d) best = { d, pt: q, dir: [dx, dy] };
    }
  }
  if (!best) return null;
  return {
    point: fromXY(best.pt, p),
    along: normAngle((Math.atan2(best.dir[1], best.dir[0]) * 180) / Math.PI),
    distance: best.d,
  };
}

/**
 * Giro para un terreno en `center` con el frente paralelo a la calle y, si se
 * sabe de qué lado está, mirando hacia ella.
 */
export function angleTowardStreet(center: LatLng, street: StreetHint): number {
  if (street.distance < 2) return street.along;
  const facing = angleFacing(center, street.point);
  const diff = Math.abs(((street.along - facing + 540) % 360) - 180);
  return diff <= 90 ? street.along : normAngle(street.along + 180);
}
