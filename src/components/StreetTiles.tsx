"use client";

import { TileLayer } from "react-leaflet";

/**
 * Mapa base de calles (vista "Mapa" y mapas de propiedades), compartido por
 * todos los mapas del sitio y del admin.
 *
 * Antes se usaba CARTO light_all, pero CARTO pasó a exigir clave y cada tile
 * devolvía un cartel "API KEY REQUIRED": todos los mapas se veían rotos.
 * Se reemplaza por el Light Gray Canvas de Esri (mismo proveedor que el
 * satélite, sin clave, estética parecida).
 *
 * La base tiene datos hasta z16 en San Rafael; de z17 en adelante devuelve
 * "Map data not yet available". Con maxNativeZoom 16, Leaflet amplía el
 * último tile real en vez de pedir uno que no existe.
 */

const BASE_MAX_NATIVE_ZOOM = 16;
const MAX_ZOOM = 19;

export default function StreetTiles() {
  return (
    <>
      <TileLayer
        attribution="Tiles &copy; Esri &mdash; Esri, HERE, Garmin, &copy; OpenStreetMap"
        url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}"
        maxNativeZoom={BASE_MAX_NATIVE_ZOOM}
        maxZoom={MAX_ZOOM}
      />
      {/* Nombres de calles por encima de la base */}
      <TileLayer
        url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}"
        maxNativeZoom={BASE_MAX_NATIVE_ZOOM}
        maxZoom={MAX_ZOOM}
      />
    </>
  );
}
