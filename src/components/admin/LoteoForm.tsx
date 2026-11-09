"use client";

import { useState } from "react";
import { saveLoteoAction, geocodeAction } from "@/app/admin/actions";
import type { Loteo, Lot } from "@/lib/loteos";
import LocationPicker from "./LocationPicker";
import LoteoLotsEditor from "./LoteoLotsEditor";
import AdminForm from "./AdminForm";
import SingleImageUpload from "./SingleImageUpload";
import { AutoTextarea, Field, Panel, Spinner } from "./ui";

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
  const [image, setImage] = useState(loteo?.image ?? "");
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
    <AdminForm
      action={saveLoteoAction}
      submitLabel={isEdit ? "Guardar cambios" : "Crear loteo"}
      cancelHref="/admin/loteos"
    >
      {isEdit && <input type="hidden" name="slug" value={loteo.slug} />}
      <input type="hidden" name="lots" value={JSON.stringify(lots)} />
      <input type="hidden" name="lat" value={coords[0]} />
      <input type="hidden" name="lng" value={coords[1]} />
      <input type="hidden" name="image" value={image} />

      <div className="space-y-4">
        <Panel title="Datos del loteo">
          <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_240px]">
            <div className="space-y-5">
              <Field label="Nombre">
                <input
                  name="title"
                  required
                  defaultValue={loteo?.title}
                  className="admin-input"
                  placeholder="Ej: Loteo Portal del Diamante"
                />
              </Field>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Zona / barrio">
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
              <Field label="Descripción">
                <AutoTextarea
                  name="description"
                  minRows={4}
                  defaultValue={loteo?.description}
                  className="leading-relaxed"
                  placeholder="Servicios, accesos, entorno, financiación…"
                />
              </Field>
            </div>
            <div>
              <span className="admin-label">Foto de portada</span>
              <div className="mt-2">
                <SingleImageUpload value={image} onChange={setImage} />
              </div>
            </div>
          </div>
        </Panel>

        {/* ---- Paso 1: ubicación. Mapa gris, solo mueve el pin. ---- */}
        <Panel
          title="1 · Ubicación del loteo"
          description={
            <>
              Marcá <strong className="font-medium text-ink">dónde abre el plano</strong>.
              En este mapa solo se mueve el pin: los lotes se dibujan en el paso 2.
            </>
          }
        >
          <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
            <Field label="Dirección / referencia">
              <input
                name="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    void onGeocode();
                  }
                }}
                className="admin-input"
                placeholder="Ej: Patricias Mendocinas 3111"
                enterKeyHint="search"
              />
            </Field>
            <button
              type="button"
              onClick={onGeocode}
              disabled={geoState.loading || !location.trim()}
              className="glass-btn justify-center py-[0.68rem]"
            >
              {geoState.loading ? (
                <>
                  <Spinner /> Buscando…
                </>
              ) : (
                "Buscar en el mapa"
              )}
            </button>
          </div>
          {geoState.error && <p className="mt-2 text-sm text-red-700">{geoState.error}</p>}
          {geoState.label && !geoState.error && (
            <p className="mt-2 text-xs text-ink-soft/60">
              Encontrado: {geoState.label}. Si no es exacto, mové el pin.
            </p>
          )}

          <div className="mt-4">
            <LocationPicker coords={coords} onChange={updateCoords} />
          </div>
          <div className="mt-4 max-w-sm">
            <Field
              label="Coordenadas (lat, lng)"
              hint="Si la búsqueda cae en otro lado, pegá acá las coordenadas de Google Maps."
            >
              <input
                type="text"
                inputMode="decimal"
                value={coordsText}
                onChange={(e) => {
                  setCoordsText(e.target.value);
                  const parsed = parseLatLng(e.target.value);
                  if (parsed) setCoords(parsed);
                }}
                className="admin-input font-mono text-sm"
                placeholder="-34.6176, -68.3319"
              />
            </Field>
          </div>
        </Panel>

        {/* ---- Paso 2: dibujo de lotes sobre el satélite. ---- */}
        <Panel
          title="2 · Lotes"
          description="Agregá cada lote, marcá sus esquinas sobre el satélite y completá precio y estado. Los m² se calculan solos."
          aside={
            <span
              className={`glass-chip ${drawn < lots.length ? "glass-chip--warn" : ""}`}
            >
              {drawn} de {lots.length} dibujados
            </span>
          }
        >
          {drawn < lots.length && (
            <p className="mb-3 rounded-xl bg-[#d9a441]/15 px-3 py-2 text-xs text-[#7a5310]">
              Los lotes sin contorno no se guardan.
            </p>
          )}
          <LoteoLotsEditor center={coords} lots={lots} onChange={setLots} />
        </Panel>
      </div>
    </AdminForm>
  );
}
