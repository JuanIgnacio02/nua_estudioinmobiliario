"use client";

import { useState } from "react";
import Link from "next/link";
import {
  TYPE_LABELS,
  OPERATION_LABELS,
  propertyImages,
  type Property,
  type Operation,
  type PropertyType,
} from "@/lib/properties";
import { savePropertyAction, geocodeAction } from "@/app/admin/actions";
import TagInput from "./TagInput";
import ImageManager from "./ImageManager";
import LocationPicker from "./LocationPicker";

const OPERATIONS = Object.keys(OPERATION_LABELS) as Operation[];
const TYPES = Object.keys(TYPE_LABELS) as PropertyType[];

/** Parse "lat, lng" (como copia Google Maps) a [lat, lng]. Tolera coma o espacio. */
function parseLatLng(s: string): [number, number] | null {
  const nums = s
    .split(/[,\s]+/)
    .map((t) => t.trim())
    .filter(Boolean)
    .map(Number);
  if (nums.length === 2 && nums.every(Number.isFinite)) {
    return [nums[0], nums[1]];
  }
  return null;
}

export default function PropertyForm({ property }: { property?: Property }) {
  const isEdit = !!property;
  const [images, setImages] = useState<string[]>(
    property ? propertyImages(property) : []
  );
  const [services, setServices] = useState<string[]>(property?.services ?? []);
  const [amenities, setAmenities] = useState<string[]>(
    property?.amenities ?? []
  );
  const [highlights, setHighlights] = useState<string[]>(
    property?.highlights ?? []
  );
  const [location, setLocation] = useState(property?.location ?? "");
  const [coords, setCoords] = useState<[number, number] | undefined>(
    property?.coords
  );
  // Texto del campo combinado "lat, lng" (lo que pegás de Google Maps).
  const [coordsText, setCoordsText] = useState(
    property?.coords ? `${property.coords[0]}, ${property.coords[1]}` : ""
  );
  const [areaValue, setAreaValue] = useState<number | undefined>(property?.area);
  const [coveredValue, setCoveredValue] = useState<number | undefined>(
    property?.coveredArea
  );
  const [geoState, setGeoState] = useState<{
    loading: boolean;
    label?: string;
    error?: string;
  }>({ loading: false });

  // Setea las coords desde el mapa/geocoding y refleja el texto del campo.
  const updateCoords = (c: [number, number] | undefined) => {
    setCoords(c);
    setCoordsText(c ? `${c[0]}, ${c[1]}` : "");
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

  return (
    <form action={savePropertyAction} className="space-y-10">
      {isEdit && <input type="hidden" name="slug" value={property.slug} />}
      <input type="hidden" name="images" value={JSON.stringify(images)} />
      <input type="hidden" name="services" value={JSON.stringify(services)} />
      <input type="hidden" name="amenities" value={JSON.stringify(amenities)} />
      <input type="hidden" name="highlights" value={JSON.stringify(highlights)} />
      {coords && (
        <>
          <input type="hidden" name="lat" value={coords[0]} />
          <input type="hidden" name="lng" value={coords[1]} />
        </>
      )}

      {/* Gallery */}
      <ImageManager value={images} onChange={setImages} />

      {/* Basics */}
      <section>
        <div className="space-y-5">
          <Field label="Título">
            <input
              name="title"
              required
              defaultValue={property?.title}
              className="admin-input"
              placeholder="Ej: Casa en Barrio Garbín"
            />
          </Field>
          <div className="grid gap-5 sm:grid-cols-3">
            <Field label="Operación">
              <select
                name="operation"
                defaultValue={property?.operation ?? "venta"}
                className="admin-input"
              >
                {OPERATIONS.map((o) => (
                  <option key={o} value={o}>
                    {OPERATION_LABELS[o]}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Tipo">
              <select
                name="type"
                defaultValue={property?.type ?? "casa"}
                className="admin-input"
              >
                {TYPES.map((t) => (
                  <option key={t} value={t}>
                    {TYPE_LABELS[t]}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Precio (US$)">
              <input
                name="price"
                type="number"
                min="0"
                required
                defaultValue={property?.price}
                className="admin-input"
              />
            </Field>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Sup. del terreno (m²)">
              <input
                name="area"
                type="number"
                min="0"
                required
                value={areaValue ?? ""}
                onChange={(e) =>
                  setAreaValue(
                    e.target.value === "" ? undefined : Number(e.target.value)
                  )
                }
                className="admin-input"
                placeholder="Ej: 300"
              />
            </Field>
            <Field label="Sup. cubierta (m²)">
              <input
                name="coveredArea"
                type="number"
                min="0"
                value={coveredValue ?? ""}
                onChange={(e) =>
                  setCoveredValue(
                    e.target.value === "" ? undefined : Number(e.target.value)
                  )
                }
                className="admin-input"
                placeholder="Opcional — Ej: 180"
              />
            </Field>
          </div>
          <div className="grid gap-5 sm:grid-cols-3">
            <Field label="Dormitorios">
              <input
                name="bedrooms"
                type="number"
                min="0"
                defaultValue={property?.bedrooms}
                className="admin-input"
                placeholder="—"
              />
            </Field>
            <Field label="Baños">
              <input
                name="bathrooms"
                type="number"
                min="0"
                defaultValue={property?.bathrooms}
                className="admin-input"
                placeholder="—"
              />
            </Field>
            <Field label="Destacada">
              <label className="mt-2 flex items-center gap-2 text-sm text-ink-soft">
                <input
                  type="checkbox"
                  name="featured"
                  defaultChecked={property?.featured}
                  className="h-4 w-4 accent-moss-600"
                />
                En portada
              </label>
            </Field>
          </div>
        </div>
      </section>

      {/* Location + geocoding */}
      <section className="rounded-2xl border border-moss-600/10 bg-mint-50/30 p-6">
        <span className="text-eyebrow text-sage-500">Ubicación</span>
        <div className="mt-3 grid gap-5 sm:grid-cols-[1fr_auto]">
          <input
            name="location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="admin-input"
            placeholder="Dirección: Ej: Libertad 1513, San Rafael"
          />
          <button
            type="button"
            onClick={onGeocode}
            disabled={geoState.loading}
            className="rounded-full bg-moss-600 px-6 py-2.5 text-sm font-medium text-mint-100 transition-colors hover:bg-moss-700 disabled:opacity-60"
          >
            {geoState.loading ? "Buscando…" : "📍 Ubicar en el mapa"}
          </button>
        </div>
        <div className="mt-3 grid gap-5 sm:grid-cols-2">
          <Field label="Zona / Barrio (filtro)">
            <input
              name="zone"
              defaultValue={property?.zone}
              className="admin-input"
              placeholder="Ej: Barrio SAT"
            />
          </Field>
          <Field label="Ciudad">
            <input
              name="city"
              defaultValue={property?.city ?? "San Rafael"}
              className="admin-input"
            />
          </Field>
        </div>
        {coords && (
          <p className="mt-3 text-sm text-moss-600">
            ✓ Ubicada en el mapa ({coords[0].toFixed(4)}, {coords[1].toFixed(4)})
            {geoState.label && (
              <span className="text-ink-soft/60"> — {geoState.label}</span>
            )}
          </p>
        )}
        {geoState.error && (
          <p className="mt-3 text-sm text-red-600">{geoState.error}</p>
        )}

        {/* Interactive picker — buscá por dirección y/o ajustá a mano */}
        <div className="mt-4">
          <LocationPicker coords={coords} onChange={updateCoords} />
        </div>

        {/* Coordenadas: pegá el par de una (como copia Google Maps) */}
        <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
          <Field label="Coordenadas (lat, lng)">
            <input
              type="text"
              inputMode="decimal"
              value={coordsText}
              onChange={(e) => {
                setCoordsText(e.target.value);
                const parsed = parseLatLng(e.target.value);
                if (parsed) setCoords(parsed);
                else if (e.target.value.trim() === "") setCoords(undefined);
              }}
              className="admin-input"
              placeholder="-34.6176, -68.3319"
            />
          </Field>
          {coords && (
            <button
              type="button"
              onClick={() => updateCoords(undefined)}
              className="mb-0.5 rounded-full border border-moss-600/20 px-4 py-2.5 text-sm text-ink-soft/70 transition-colors hover:bg-mint-100"
            >
              Quitar pin
            </button>
          )}
        </div>
        <p className="mt-2 text-xs text-ink-soft/60">
          Pegá las dos coordenadas juntas desde Google Maps (ej.{" "}
          <span className="font-mono">-34.6176, -68.3319</span>) o marcá el punto
          en el mapa de arriba — se sincronizan.
        </p>
      </section>

      {/* Description */}
      <Field label="Descripción">
        <textarea
          name="description"
          rows={5}
          required
          defaultValue={property?.description}
          className="admin-input resize-none"
          placeholder="Descripción atractiva de la propiedad…"
        />
      </Field>

      {/* Lists */}
      <div className="grid gap-8 md:grid-cols-3">
        <TagInput
          label="Servicios"
          value={services}
          onChange={setServices}
          suggestions={["Luz", "Agua", "Gas", "Pozo", "Cloacas"]}
        />
        <TagInput
          label="Amenities"
          value={amenities}
          onChange={setAmenities}
          suggestions={["Piscina", "SUM", "Parrilla", "Seguridad 24hs"]}
        />
        <TagInput
          label="Destacados (highlights)"
          value={highlights}
          onChange={setHighlights}
          placeholder="Ej: Piscina climatizada"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4 border-t border-moss-600/10 pt-6">
        <button
          type="submit"
          className="rounded-full bg-moss-600 px-8 py-3.5 text-sm font-medium text-mint-100 transition-colors hover:bg-moss-700 disabled:opacity-60"
        >
          {isEdit ? "Guardar cambios" : "Crear propiedad"}
        </button>
        <Link
          href="/admin/propiedades"
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
