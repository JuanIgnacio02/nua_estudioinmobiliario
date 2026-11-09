"use client";

import { useState } from "react";
import type { SiteSettings } from "@/lib/properties";
import { saveAboutAction } from "@/app/admin/actions";
import { pillarText } from "@/lib/properties";
import TagInput from "./TagInput";
import AdminForm from "./AdminForm";
import SingleImageUpload from "./SingleImageUpload";
import { AutoTextarea, Field, Panel } from "./ui";

export default function AboutEditor({
  about,
}: {
  about: SiteSettings["about"];
}) {
  const [teamImage, setTeamImage] = useState(about.teamImage);
  const [paragraphs, setParagraphs] = useState<string[]>(
    about.paragraphs.length ? about.paragraphs : [""]
  );
  const [pillars, setPillars] = useState<string[]>(about.pillars);
  const [pillarTexts, setPillarTexts] = useState<Record<string, string>>(() =>
    Object.fromEntries(about.pillars.map((p) => [p, pillarText(about, p)]))
  );

  return (
    <AdminForm action={saveAboutAction} submitLabel="Guardar cambios" stayOnPage className="mt-8">
      <input type="hidden" name="teamImage" value={teamImage} />
      <input
        type="hidden"
        name="paragraphs"
        value={JSON.stringify(paragraphs.filter((p) => p.trim()))}
      />
      <input type="hidden" name="pillars" value={JSON.stringify(pillars)} />
      <input
        type="hidden"
        name="pillarTexts"
        value={JSON.stringify(
          Object.fromEntries(pillars.map((p) => [p, pillarTexts[p] ?? ""]))
        )}
      />

      <div className="space-y-4">
        <Panel
          title="Presentación"
          description="La foto y los párrafos que abren la página Nosotras."
        >
          <div className="grid gap-6 md:grid-cols-[220px_1fr]">
            <div>
              <span className="admin-label">Foto del equipo</span>
              <div className="mt-2">
                <SingleImageUpload
                  value={teamImage}
                  onChange={setTeamImage}
                  aspect="aspect-[7/6]"
                  removable={false}
                />
              </div>
            </div>

            <div>
              <span className="admin-label">Párrafos</span>
              <div className="mt-2 space-y-3">
                {paragraphs.map((para, i) => (
                  <div key={i} className="group relative">
                    <AutoTextarea
                      value={para}
                      onChange={(e) =>
                        setParagraphs((prev) =>
                          prev.map((p, j) => (j === i ? e.target.value : p))
                        )
                      }
                      minRows={3}
                      className="pr-10 leading-relaxed"
                      placeholder={`Párrafo ${i + 1}`}
                      aria-label={`Párrafo ${i + 1}`}
                    />
                    {paragraphs.length > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          setParagraphs((prev) => prev.filter((_, j) => j !== i))
                        }
                        aria-label={`Quitar párrafo ${i + 1}`}
                        title="Quitar párrafo"
                        className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full text-ink-soft/40 transition-colors hover:bg-red-500/10 hover:text-red-600"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden>
                          <path d="M6 6l12 12M18 6 6 18" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setParagraphs((prev) => [...prev, ""])}
                  className="glass-btn text-xs"
                >
                  + Agregar párrafo
                </button>
              </div>
            </div>
          </div>
        </Panel>

        <Panel
          title="Pilares"
          description="Las palabras grandes de la página y la frase de cada tarjeta."
        >
          <TagInput
            label="Palabras"
            value={pillars}
            onChange={setPillars}
            suggestions={["Cercanía", "Energía", "Compromiso", "Acompañamiento"]}
          />
          {pillars.length > 0 && (
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {pillars.map((p) => (
                <Field key={p} label={p}>
                  <input
                    value={pillarTexts[p] ?? ""}
                    onChange={(e) =>
                      setPillarTexts((prev) => ({ ...prev, [p]: e.target.value }))
                    }
                    className="admin-input"
                    placeholder="Una frase corta"
                  />
                </Field>
              ))}
            </div>
          )}
        </Panel>

        <Panel title="Misión, visión y valores">
          <div className="grid gap-5 md:grid-cols-3">
            <Field label="Misión">
              <AutoTextarea name="mission" minRows={5} defaultValue={about.mission} className="leading-relaxed" />
            </Field>
            <Field label="Visión">
              <AutoTextarea name="vision" minRows={5} defaultValue={about.vision} className="leading-relaxed" />
            </Field>
            <Field label="Valores">
              <AutoTextarea name="values" minRows={5} defaultValue={about.values} className="leading-relaxed" />
            </Field>
          </div>
        </Panel>
      </div>
    </AdminForm>
  );
}
