/**
 * Columnas de un menú desplegable. Con muchas opciones, en vez de una lista
 * larga que obliga a scrollear, se acomodan en columnas (más "cuadrado").
 * `items` cuenta opciones + títulos de grupo.
 */
export function menuColumns(items: number) {
  if (items > 16) return 3;
  if (items > 9) return 2;
  return 1;
}
