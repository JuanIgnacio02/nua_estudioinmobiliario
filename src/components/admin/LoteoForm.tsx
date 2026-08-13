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

      {/* ---- Paso 1: ubicación. Mapa gris, solo mueve el pin. ---- */}
      <section className="rounded-2xl border border-moss-600/15 bg-white/50 p-5 md:p-6">
        <div className="flex items-start gap-3">
          <StepBadge n={1} />
          <div>
            <h3 className="font-display text-xl leading-tight text-ink">
              Ubicación del loteo
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-ink-soft/70">
              Marca <strong className="text-ink">dónde abre el plano</strong>. En
              este mapa solo se mueve el pin —{" "}
              <strong className="text-ink">acá no se dibujan los lotes</strong>.
            </p>
          </div>
        </div>

        <div className="mt-4">
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
          <p className="mt-2 text-xs text-ink-soft/60">
            Si el buscador de dirección cae en otra ciudad, pegá acá las
            coordenadas de Google Maps.
          </p>
        </div>
      </section>

      {/* ---- Paso 2: dibujo. Card verde y satélite, para no confundirlo. ---- */}
      <section className="rounded-2xl border-2 border-moss-600/35 bg-mint-50 p-5 md:p-6">
        <div className="flex items-start gap-3">
          <StepBadge n={2} accent />
          <div className="flex-1">
            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
              <h3 className="font-display text-xl leading-tight text-ink">
                Dibujar los lotes
              </h3>
              <span className="text-xs text-ink-soft/70">
                {drawn} de {lots.length} dibujados
                {drawn < lots.length &&
                  " · los que no tengan contorno no se guardan"}
              </span>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-ink-soft/70">
              <strong className="text-ink">Este es el mapa para dibujar.</strong>{" "}
              Agregá un lote, tocá cada esquina sobre el satélite y completá
              número, precio y estado. Los m² se calculan solos.
            </p>
          </div>
        </div>

        <div className="mt-4">
          <LoteoLotsEditor center={coords} lots={lots} onChange={setLots} />
        </div>
      </section>

      {/* Acciones */}
      <div className="flex items-center gap-4 border-t border-moss-600/10 pt-6">
        <button
          type="submit"
          className="glass-btn-primary disabled:opacity-60"
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

/** Número de paso. `accent` marca el paso donde se dibuja. */
function StepBadge({ n, accent = false }: { n: number; accent?: boolean }) {
  return (
    <span
      aria-hidden
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-display text-sm font-semibold ${
        accent
          ? "bg-moss-600 text-mint-50"
          : "border border-moss-600/25 bg-white text-moss-600"
      }`}
    >
      {n}
    </span>
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
