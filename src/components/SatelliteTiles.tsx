"use client";

import { TileLayer } from "react-leaflet";

/**
 * Capas satelitales de Esri, compartidas por todos los mapas (visor de lote,
 * master plan y los editores del admin).
 *
 * Por qué maxNativeZoom = 17:
 * Esri no tiene la misma resolución en todo el país. En San Rafael la imagen
 * real llega hasta z17; de z18 en adelante devuelve un tile gris que dice
 * "Map data not yet available". Al pedir z19 (como se hacía antes), al hacer
 * zoom aparecía ese cartel gris en vez del terreno.
 *
 * Con maxNativeZoom en 17, Leaflet deja de pedir tiles que no existen y agranda
 * el último con imagen real: al acercarse siempre se ve el lugar (más blando,
 * pero real) y nunca el cartel gris.
 *
 * La capa de calles sí tiene datos hasta z19, así que se deja en 19 para que
 * los nombres se lean nítidos sobre la imagen ampliada.
 */

/** Último zoom con imagen satelital real en la zona donde opera NÚA. */
export const SAT_MAX_NATIVE_ZOOM = 17;
/**
 * Hasta dónde se puede acercar. Tope 19 = como mucho 4x de ampliación sobre la
 * imagen real: suficiente para marcar esquinas con precisión (un frente de 15 m
 * ocupa ~60 px) sin que la foto se vuelva una mancha. En zonas donde Esri sí
 * tiene z19 (Mendoza capital, Buenos Aires) se ve nítida, sin ampliar.
 */
export const SAT_MAX_ZOOM = 19;

const LABELS_MAX_NATIVE_ZOOM = 19;

export default function SatelliteTiles() {
  return (
    <>
      <TileLayer
        attribution="Imagery &copy; Esri, Maxar, Earthstar Geographics"
        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        maxNativeZoom={SAT_MAX_NATIVE_ZOOM}
        maxZoom={SAT_MAX_ZOOM}
      />
      {/* Nombres de calles por encima del satélite */}
      <TileLayer
        url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}"
        maxNativeZoom={LABELS_MAX_NATIVE_ZOOM}
        maxZoom={SAT_MAX_ZOOM}
      />
    </>
  );
}
