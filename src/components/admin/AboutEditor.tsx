"use client";

import { useState } from "react";
import Image from "next/image";
import type { SiteSettings } from "@/lib/properties";
import { saveAboutAction, uploadGenericImageAction } from "@/app/admin/actions";
import TagInput from "./TagInput";

export default function AboutEditor({
  about,
}: {
  about: SiteSettings["about"];
}) {
  const [teamImage, setTeamImage] = useState(about.teamImage);
  const [uploading, setUploading] = useState(false);
  const [paragraphs, setParagraphs] = useState<string[]>(
    about.paragraphs.length ? about.paragraphs : [""]
  );
  const [pillars, setPillars] = useState<string[]>(about.pillars);

  const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await uploadGenericImageAction(fd);
    setUploading(false);
    if (res.ok && res.image) setTeamImage(res.image);
    else alert(res.error ?? "Error al subir");
  };

  return (
    <form action={saveAboutAction} className="mt-8 space-y-8">
      <input type="hidden" name="teamImage" value={teamImage} />
      <input
        type="hidden"
        name="paragraphs"
        value={JSON.stringify(paragraphs.filter((p) => p.trim()))}
      />
      <input type="hidden" name="pillars" value={JSON.stringify(pillars)} />

      <section className="grid gap-8 lg:grid-cols-[240px_1fr]">
        <div>
          <span className="text-eyebrow text-sage-500">Foto del equipo</span>
          <label className="mt-2 flex aspect-[7/6] cursor-pointer items-center justify-center overflow-hidden rounded-2xl border border-dashed border-moss-600/25 bg-mint-50/40 text-center transition-colors hover:bg-mint-100/50">
            {teamImage ? (
              <span className="relative h-full w-full">
                <Image
                  src={teamImage}
                  alt="Equipo"
                  fill
                  className="object-cover"
                  sizes="240px"
                />
              </span>
            ) : (
              <span className="px-4 text-sm text-ink-soft/60">
                {uploading ? "Comprimiendo…" : "Subí una foto"}
              </span>
            )}
            <input type="file" accept="image/*" onChange={onUpload} className="hidden" />
          </label>
        </div>

        <div className="space-y-5">
          <div>
            <span className="text-eyebrow text-sage-500">
              Párrafos de presentación
            </span>
            <div className="mt-2 space-y-3">
              {paragraphs.map((para, i) => (
                <div key={i} className="flex gap-2">
                  <textarea
                    value={para}
                    onChange={(e) =>
                      setParagraphs((prev) =>
                        prev.map((p, j) => (j === i ? e.target.value : p))
                      )
                    }
                    rows={3}
                    className="admin-input resize-none"
                    placeholder={`Párrafo ${i + 1}`}
                  />
                  {paragraphs.length > 1 && (
                    <button
                      type="button"
                      onClick={() =>
                        setParagraphs((prev) => prev.filter((_, j) => j !== i))
                      }
                      className="shrink-0 rounded-lg px-2 text-ink-soft/50 hover:bg-red-500/10 hover:text-red-600"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => setParagraphs((prev) => [...prev, ""])}
                className="text-sm text-moss-600 hover:underline"
              >
                + Agregar párrafo
              </button>
            </div>
          </div>

          <TagInput
            label="Pilares (palabras clave)"
            value={pillars}
            onChange={setPillars}
            suggestions={["Cercanía", "Energía", "Compromiso", "Acompañamiento"]}
          />
        </div>
      </section>

      <div className="grid gap-6 md:grid-cols-3">
        <label className="block">
          <span className="text-eyebrow text-sage-500">Misión</span>
          <textarea
            name="mission"
            rows={6}
            defaultValue={about.mission}
            className="admin-input mt-2 resize-none"
          />
        </label>
        <label className="block">
          <span className="text-eyebrow text-sage-500">Visión</span>
          <textarea
            name="vision"
            rows={6}
            defaultValue={about.vision}
            className="admin-input mt-2 resize-none"
          />
        </label>
        <label className="block">
          <span className="text-eyebrow text-sage-500">Valores</span>
          <textarea
            name="values"
            rows={6}
            defaultValue={about.values}
            className="admin-input mt-2 resize-none"
          />
        </label>
      </div>

      <button
        type="submit"
        disabled={uploading}
        className="glass-btn-primary disabled:opacity-60"
      >
        Guardar cambios
      </button>
    </form>
  );
}
