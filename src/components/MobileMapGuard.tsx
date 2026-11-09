"use client";

import { useEffect, useState } from "react";
import { useMap } from "react-leaflet";

/**
 * En pantallas táctiles, un mapa grande "atrapa" el scroll: deslizar un dedo
 * mueve el mapa en vez de la página. Acá el mapa arranca en reposo (un dedo
 * scrollea la página; dos dedos siguen haciendo zoom) y se activa al tocarlo.
 * Cuando sale de pantalla vuelve a reposo. En escritorio no cambia nada.
 *
 * Funciona porque Leaflet solo pone `touch-action: none` cuando el arrastre
 * está habilitado; deshabilitado, el navegador hace scroll normal.
 */
export default function MobileMapGuard({
  placement = "center",
}: {
  /** "top": el aviso va arriba, para no tapar lo que se muestra en el centro. */
  placement?: "center" | "top";
} = {}) {
  const map = useMap();
  // Solo se monta en el cliente (los mapas se cargan con ssr:false).
  const [coarse] = useState(() => window.matchMedia("(pointer: coarse)").matches);
  const [locked, setLocked] = useState(coarse);

  useEffect(() => {
    if (!coarse) return;
    if (locked) map.dragging.disable();
    else map.dragging.enable();
  }, [map, coarse, locked]);

  useEffect(() => {
    if (!coarse) return;
    const unlock = () => setLocked(false);
    map.on("click", unlock);
    const io = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) setLocked(true);
    });
    io.observe(map.getContainer());
    return () => {
      map.off("click", unlock);
      io.disconnect();
    };
  }, [map, coarse]);

  if (!coarse || !locked) return null;
  return (
    <div
      className={`pointer-events-none absolute left-1/2 z-[1000] -translate-x-1/2 whitespace-nowrap rounded-full bg-ink/70 px-4 py-2 text-xs font-medium text-white shadow-lg backdrop-blur-sm ${
        placement === "top" ? "top-14" : "top-1/2 -translate-y-1/2"
      }`}
    >
      Tocá el mapa para moverlo
    </div>
  );
}
