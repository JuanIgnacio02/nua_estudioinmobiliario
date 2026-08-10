"use client";

import dynamic from "next/dynamic";

const BoundaryPickerMap = dynamic(() => import("./BoundaryPickerMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-mint-100/40 text-sm text-sage-500">
      Cargando editor…
    </div>
  ),
});

export default function BoundaryPicker({
  center,
  area,
  boundary,
  onChange,
}: {
  center: [number, number];
  area?: number;
  boundary: [number, number][];
  onChange: (b: [number, number][]) => void;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-moss-600/15">
      <div className="h-[380px] w-full">
        <BoundaryPickerMap
          center={center}
          area={area}
          boundary={boundary}
          onChange={onChange}
        />
      </div>
      <p className="bg-mint-50/60 px-4 py-2 text-xs leading-relaxed text-ink-soft/70">
        ✏️ Tocá cada esquina del lote sobre el satélite para dibujar el contorno.
        Arrastrá un punto para corregirlo, tocalo para borrarlo. Con{" "}
        <strong>Generar desde m²</strong> arrancás de un rectángulo del tamaño
        correcto y lo ajustás.
      </p>
    </div>
  );
}
