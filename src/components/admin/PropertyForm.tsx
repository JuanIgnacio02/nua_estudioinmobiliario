"use client";

import { useState } from "react";
import {
  TYPE_LABELS,
  OPERATION_LABELS,
  propertyImages,
  type Property,
  type SaleStatus,
  type Operation,
  type PropertyType,
} from "@/lib/properties";
import { savePropertyAction, geocodeAction } from "@/app/admin/actions";
import PropertyCard from "@/components/PropertyCard";
import TagInput from "./TagInput";
import ImageManager from "./ImageManager";
import LocationPicker from "./LocationPicker";
import TerrainEditor from "./TerrainEditor";
import AdminForm from "./AdminForm";
import { AutoTextarea, Field, Panel, Segmented, Spinner, Switch } from "./ui";

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

const numOrUndef = (v: FormDataEntryValue | null) => {
  const n = parseFloat(String(v ?? ""));
  return Number.isFinite(n) ? n : undefined;
};

export default function PropertyForm({ property }: { property?: Property }) {
  const isEdit = !!property;
  const [images, setImages] = useState<string[]>(
    property ? propertyImages(property) : []
  );
  const [services, setServices] = useState<string[]>(property?.services ?? []);
  const [amenities, setAmenities] = useState<string[]>(property?.amenities ?? []);
  const [highlights, setHighlights] = useState<string[]>(property?.highlights ?? []);
  const [location, setLocation] = useState(property?.location ?? "");
  const [coords, setCoords] = useState<[number, number] | undefined>(property?.coords);
  // Texto del campo combinado "lat, lng" (lo que pegás de Google Maps).
  const [coordsText, setCoordsText] = useState(
    property?.coords ? `${property.coords[0]}, ${property.coords[1]}` : ""
  );
  const [areaValue, setAreaValue] = useState<number | undefined>(property?.area);
  const [coveredValue, setCoveredValue] = useState<number | undefined>(
    property?.coveredArea
  );
  const [boundary, setBoundary] = useState<[number, number][]>(property?.boundary ?? []);
  // Borrador: se guarda pero no sale en la web. Propiedades ya cargadas
  // (sin el campo) siguen publicadas.
  const [draft, setDraft] = useState(property?.draft ?? false);
  const [status, setStatus] = useState<SaleStatus>(property?.status ?? "disponible");
  const [featured, setFeatured] = useState(property?.featured ?? false);
  const [geoState, setGeoState] = useState<{
    loading: boolean;
    label?: string;
    error?: string;
  }>({ loading: false });
  // Valores actuales del formulario, para la vista previa.
  const [values, setValues] = useState<FormData | null>(null);

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

  const v = (k: string) => String(values?.get(k) ?? "").trim();
  const previewProperty: Property = {
    slug: property?.slug ?? "vista-previa",
    title: v("title") || "Título de la propiedad",
    operation: (v("operation") as Operation) || property?.operation || "venta",
    type: (v("type") as PropertyType) || property?.type || "casa",
    price: numOrUndef(values?.get("price") ?? null) ?? 0,
    currency: "USD",
    location: location || "Dirección",
    zone: v("zone"),
    city: v("city") || "San Rafael",
    area: areaValue ?? 0,
    coveredArea: coveredValue,
    bedrooms: numOrUndef(values?.get("bedrooms") ?? null),
    bathrooms: numOrUndef(values?.get("bathrooms") ?? null),
    services: [],
    amenities: [],
    highlights: [],
    image: images[0] ?? "",
    images,
    featured,
    draft,
    status,
    description: "",
  };

  return (
    <AdminForm
      action={savePropertyAction}
      submitLabel={isEdit ? "Guardar cambios" : "Crear propiedad"}
      cancelHref="/admin/propiedades"
      onValues={setValues}
    >
      {isEdit && <input type="hidden" name="slug" value={property.slug} />}
      <input type="hidden" name="images" value={JSON.stringify(images)} />
      <input type="hidden" name="services" value={JSON.stringify(services)} />
      <input type="hidden" name="amenities" value={JSON.stringify(amenities)} />
      <input type="hidden" name="highlights" value={JSON.stringify(highlights)} />
      <input type="hidden" name="boundary" value={JSON.stringify(boundary)} />
      {coords && (
        <>
          <input type="hidden" name="lat" value={coords[0]} />
          <input type="hidden" name="lng" value={coords[1]} />
        </>
      )}
      {draft && <input type="hidden" name="draft" value="on" />}
      {featured && <input type="hidden" name="featured" value="on" />}
      <input type="hidden" name="status" value={status} />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px] xl:grid-cols-[minmax(0,1fr)_330px]">
        {/* ---------------- Columna principal ---------------- */}
        <div className="min-w-0 space-y-4">
          <Panel
            title="Fotos"
            description="La primera es la portada: es la que se ve en el listado y al compartir."
            aside={
              images.length > 0 ? (
                <span className="text-xs text-ink-soft/55">
                  {images.length} foto{images.length === 1 ? "" : "s"}
                </span>
              ) : null
            }
          >
            <ImageManager value={images} onChange={setImages} />
          </Panel>

          <Panel title="Datos principales">
            <div className="space-y-5">
              <Field label="Título">
                <input
                  name="title"
                  required
                  defaultValue={property?.title}
                  className="admin-input"
                  placeholder="Ej: Casa en Barrio Garbín"
                  maxLength={110}
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
                <Field label="Precio (US$)" hint="Vacío = «Consultar»">
                  <input
                    name="price"
                    type="number"
                    min="0"
                    step="any"
                    inputMode="numeric"
                    defaultValue={property?.price || undefined}
                    className="admin-input"
                    placeholder="Ej: 120000"
                  />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-5">
                <Field label="Sup. del terreno (m²)">
                  <input
                    name="area"
                    type="number"
                    min="0"
                    step="any"
                    inputMode="decimal"
                    required
                    value={areaValue ?? ""}
                    onChange={(e) =>
                      setAreaValue(e.target.value === "" ? undefined : Number(e.target.value))
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
                    step="any"
                    inputMode="decimal"
                    value={coveredValue ?? ""}
                    onChange={(e) =>
                      setCoveredValue(e.target.value === "" ? undefined : Number(e.target.value))
                    }
                    className="admin-input"
                    placeholder="Opcional"
                  />
                </Field>
                <Field label="Dormitorios">
                  <input
                    name="bedrooms"
                    type="number"
                    min="0"
                    inputMode="numeric"
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
                    inputMode="numeric"
                    defaultValue={property?.bathrooms}
                    className="admin-input"
                    placeholder="—"
                  />
                </Field>
              </div>
            </div>
          </Panel>

          <Panel
            title="Ubicación"
            description="Sin ubicación, la propiedad no aparece en el mapa de la web."
            aside={
              coords ? (
                <span className="glass-chip">✓ En el mapa</span>
              ) : (
                <span className="glass-chip glass-chip--warn">Sin ubicar</span>
              )
            }
          >
            <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
              <Field label="Dirección">
                <input
                  name="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  onKeyDown={(e) => {
                    // Enter busca en el mapa (no guarda el formulario).
                    if (e.key === "Enter") {
                      e.preventDefault();
                      void onGeocode();
                    }
                  }}
                  className="admin-input"
                  placeholder="Ej: Libertad 1513, San Rafael"
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
            {geoState.error && (
              <p className="mt-2 text-sm text-red-700">{geoState.error}</p>
            )}
            {geoState.label && !geoState.error && (
              <p className="mt-2 text-xs text-ink-soft/60">
                Encontrado: {geoState.label}. Si no es exacto, mové el pin.
              </p>
            )}

            <div className="mt-4">
              <LocationPicker coords={coords} onChange={updateCoords} />
            </div>

            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <Field label="Zona / barrio" hint="Se usa para filtrar en la web.">
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

            <details className="group mt-5 rounded-xl border border-moss-600/10 bg-white/30 px-4 py-3">
              <summary className="cursor-pointer list-none text-sm text-ink-soft/75 marker:hidden">
                <span className="inline-flex items-center gap-2">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-open:rotate-90" aria-hidden>
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                  Pegar coordenadas de Google Maps
                </span>
              </summary>
              <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
                <Field
                  label="Coordenadas (lat, lng)"
                  hint="En Google Maps: clic derecho sobre el lugar y clic en los números."
                >
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
                    className="admin-input font-mono text-sm"
                    placeholder="-34.6176, -68.3319"
                  />
                </Field>
                {coords && (
                  <button
                    type="button"
                    onClick={() => updateCoords(undefined)}
                    className="glass-btn mb-6 justify-center text-xs"
                  >
                    Quitar ubicación
                  </button>
                )}
              </div>
            </details>

            {/* Terreno: lo que ocupa la propiedad, para mostrarlo en la ficha. */}
            <div className="mt-6 border-t border-moss-600/10 pt-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="admin-label">Terreno en el mapa (opcional)</span>
                {boundary.length >= 3 && (
                  <span className="text-xs font-medium text-moss-600">✓ Marcado</span>
                )}
              </div>
              <p className="mb-3 mt-1 text-xs leading-relaxed text-ink-soft/60">
                Marcá lo que ocupa la propiedad: en la ficha se ve sobre la foto
                satelital, con sus medidas. Para un lote común alcanza con el frente
                y el fondo.
              </p>
              {coords ? (
                <TerrainEditor
                  pin={coords}
                  value={boundary}
                  onChange={setBoundary}
                  declaredArea={areaValue}
                />
              ) : (
                <p className="rounded-xl border border-dashed border-moss-600/20 bg-white/30 px-4 py-6 text-center text-sm text-ink-soft/60">
                  Primero ubicá la propiedad en el mapa de arriba.
                </p>
              )}
            </div>
          </Panel>

          <Panel
            title="Descripción"
            description="Dejá una línea en blanco entre párrafos: en la web se respetan."
          >
            <AutoTextarea
              name="description"
              minRows={6}
              required
              defaultValue={property?.description}
              className="leading-relaxed"
              placeholder="Contá lo mejor de la propiedad: ambientes, entorno, estado…"
              aria-label="Descripción"
            />
          </Panel>

          <Panel title="Características">
            <div className="grid gap-6 md:grid-cols-3">
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
                label="Destacados"
                value={highlights}
                onChange={setHighlights}
                placeholder="Ej: Piscina climatizada"
              />
            </div>
          </Panel>
        </div>

        {/* ---------------- Columna lateral ---------------- */}
        <aside className="order-first flex flex-col gap-4 lg:order-none">
          <Panel title="Publicación">
            <div className="space-y-5">
              <div>
                <Segmented
                  full
                  label="Visibilidad"
                  value={draft}
                  onChange={setDraft}
                  options={[
                    { value: false, label: "Publicada" },
                    { value: true, label: "Borrador" },
                  ]}
                />
                <p className="mt-2 text-xs leading-relaxed text-ink-soft/60">
                  {draft
                    ? "Se guarda acá pero no aparece en la web."
                    : "Visible en la web al guardar."}
                </p>
              </div>

              <div>
                <span className="admin-label">Disponibilidad</span>
                <div className="mt-2">
                  <Segmented
                    full
                    label="Disponibilidad"
                    value={status}
                    onChange={setStatus}
                    options={[
                      { value: "disponible", label: "Disponible" },
                      { value: "reservada", label: "Reservada" },
                      { value: "vendida", label: "Vendida" },
                    ]}
                  />
                </div>
                <p className="mt-2 text-xs leading-relaxed text-ink-soft/60">
                  {status === "disponible"
                    ? "Se ofrece normalmente."
                    : status === "reservada"
                      ? "Lleva la etiqueta «Reservada»."
                      : "Queda como antecedente: al final del listado y fuera del mapa."}
                </p>
              </div>

              <div className="flex items-center justify-between gap-4 border-t border-moss-600/10 pt-4">
                <div>
                  <p className="text-sm font-medium text-ink">Destacada en portada</p>
                  <p className="mt-0.5 text-xs text-ink-soft/60">
                    Aparece en la página de inicio.
                  </p>
                </div>
                <Switch checked={featured} onChange={setFeatured} label="Destacada en portada" />
              </div>
            </div>
          </Panel>

          {/* Vista previa: la misma tarjeta que se ve en la web. */}
          <div className="hidden flex-1 lg:block">
            <div className="sticky top-6">
              <p className="admin-label mb-3 px-1">Vista previa en la web</p>
              <div className="glass-panel pointer-events-none p-4" aria-hidden>
                <PropertyCard property={previewProperty} preview eager />
              </div>
            </div>
          </div>
        </aside>
      </div>
    </AdminForm>
  );
}
