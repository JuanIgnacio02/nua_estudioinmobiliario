"use client";

import dynamic from "next/dynamic";

const LocationPickerMap = dynamic(() => import("./LocationPickerMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-mint-100/40 text-sm text-sage-500">
      Cargando mapa…
    </div>
  ),
});

export default function LocationPicker({
  coords,
  onChange,
}: {
  coords?: [number, number];
  onChange: (c: [number, number]) => void;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-moss-600/15">
      <div className="h-[320px] w-full">
        <LocationPickerMap coords={coords} onChange={onChange} />
      </div>
      <p className="bg-mint-50/60 px-4 py-2 text-xs text-ink-soft/70">
        📍 Arrastrá el pin o tocá el mapa para ajustar la ubicación exacta.
      </p>
    </div>
  );
}
