"use client";

import { useState } from "react";
import Link from "next/link";
import { saveLoteoAction, geocodeAction } from "@/app/admin/actions";
import type { Loteo, Lot } from "@/lib/loteos";
import LocationPicker from "./LocationPicker";
import LoteoLotsEditor from "./LoteoLotsEditor";

/** Parse "lat, lng" (como copia Google Maps) a [lat, lng]. */
function parseLatLng(s: string): [number, number] | null {
  const nums = s
    .split(/[,\s]+/)
    .map((t) => t.trim())
    .filter(Boolean)
    .map(Number);
  if (nums.length === 2 && nums.every(Number.isFinite)) return [nums[0], nums[1]];
  return null;
}

const DEFAULT_CENTER: [number, number] = [-34.6176, -68.3319];

export default function LoteoForm({ loteo }: { loteo?: Loteo }) {
  const isEdit = !!loteo;
  const [location, setLocation] = useState(loteo?.location ?? "");
  const [coords, setCoords] = useState<[number, number]>(
    loteo?.coords ?? DEFAULT_CENTER
  );
  const [coordsText, setCoordsText] = useState(
    loteo?.coords ? `${loteo.coords[0]}, ${loteo.coords[1]}` : ""
  );
  const [lots, setLots] = useState<Lot[]>(loteo?.lots ?? []);
  const [geoState, setGeoState] = useState<{
    loading: boolean;
    label?: string;
    error?: string;
  }>({ loading: false });

  const updateCoords = (c: [number, number]) => {
    setCoords(c);
    setCoordsText(`${c[0]}, ${c[1]}`);
  };

  const onGeocode = async () => {
    if (!location.trim()) return;
    setGeoState({ loading: true });
    const res = await geocodeAction(location);
    if (res.ok && res.coords) {
      updateCoords(res.coords);
      setGeoState({ loading: false, label: res.label });
    } else {
      setGeoState({ loading: false, error: res.error });
    }
  };

  const drawn = lots.filter((l) => l.boundary.length >= 3).length;

  return (
    <form action={saveLoteoAction} className="space-y-10">
      {isEdit && <input type="hidden" name="slug" value={loteo.slug} />}
      <input type="hidden" name="lots" value={JSON.stringify(lots)} />
      <input type="hidden" name="lat" value={coords[0]} />
      <input type="hidden" name="lng" value={coords[1]} />

      {/* Datos básicos */}
      <section className="space-y-5">
        <Field label="Nombre del loteo">
          <input
            name="title"
            required
            defaultValue={loteo?.title}
            className="admin-input"
            placeholder="Ej: Loteo Portal del Diamante"
          />
        </Field>

        <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
          <Field label="Dirección / referencia">
            <input
              name="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="admin-input"
              placeholder="Ej: Patricias Mendocinas 3111"
            />
          </Field>
          <button
            type="button"
            onClick={onGeocode}
            disabled={geoState.loading}
            className="mb-0.5 rounded-full border border-moss-600/20 px-5 py-2.5 text-sm text-moss-600 transition-colors hover:bg-mint-100 disabled:opacity-60"
          >
            {geoState.loading ? "Buscando…" : "📍 Ubicar en el mapa"}
          </button>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Zona / Barrio">
            <input
              name="zone"
              defaultValue={loteo?.zone}
              className="admin-input"
              placeholder="Ej: Periurbano"
            />
          </Field>
          <Field label="Ciudad">
            <input
              name="city"
              defaultValue={loteo?.city ?? "San Rafael"}
              className="admin-input"
            />
          </Field>
        </div>

        <Field label="Imagen de portada (URL, opcional)">
          <input
            name="image"
            defaultValue={loteo?.image}
            className="admin-input"
            placeholder="/images/… o https://…"
          />
        </Field>

        <Field label="Descripción">
          <textarea
            name="description"
            rows={4}
            defaultValue={loteo?.description}
            className="admin-input resize-none"
            placeholder="Descripción del desarrollo…"
          />
        </Field>

        {geoState.error && (
          <p className="text-sm text-red-600">{geoState.error}</p>
        )}
        {geoState.label && (
          <p className="text-sm text-moss-600">✓ {geoState.label}</p>
        )}
      </section>

      {/* Centro del master plan */}
      <section className="border-t border-moss-600/10 pt-6">
        <span className="text-eyebrow text-sage-500">
          Centro del loteo (dónde abre el plano)
        </span>
        <div className="mt-3">
          <LocationPicker coords={coords} onChange={updateCoords} />
        </div>
        <div className="mt-4 max-w-sm">
          <Field label="Coordenadas (lat, lng)">
            <input
              type="text"
              inputMode="decimal"
              value={coordsText}
              onChange={(e) => {
                setCoordsText(e.target.value);
                const parsed = parseLatLng(e.target.value);
                if (parsed) setCoords(parsed);
              }}
              className="admin-input"
              placeholder="-34.6176, -68.3319"
            />
          </Field>
        </div>
      </section>

      {/* Editor de lotes */}
      <section className="border-t border-moss-600/10 pt-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-eyebrow text-sage-500">Lotes del master plan</span>
          <span className="text-xs text-ink-soft/60">
            {drawn} de {lots.length} dibujados
            {drawn < lots.length && " · los que no tengan contorno no se guardan"}
          </span>
        </div>
        <p className="mt-1 mb-4 text-xs text-ink-soft/60">
          Agregá un lote, tocá cada esquina sobre el satélite para dibujarlo y
          completá número, precio y estado. Los m² se calculan solos.
        </p>
        <LoteoLotsEditor center={coords} lots={lots} onChange={setLots} />
      </section>

      {/* Acciones */}
      <div className="flex items-center gap-4 border-t border-moss-600/10 pt-6">
        <button
          type="submit"
          className="rounded-full bg-moss-600 px-8 py-3.5 text-sm font-medium text-mint-100 transition-colors hover:bg-moss-700 disabled:opacity-60"
        >
          {isEdit ? "Guardar cambios" : "Crear loteo"}
        </button>
        <Link
          href="/admin/loteos"
          className="text-sm text-ink-soft/70 hover:text-moss-600"
        >
          Cancelar
        </Link>
      </div>
    </form>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-eyebrow text-sage-500">{label}</span>
      <div className="mt-2">{children}</div>
    </label>
  );
}
