"use client";

import { useState } from "react";
import Image from "next/image";
import { uploadImageAction } from "@/app/admin/actions";

export default function ImageManager({
  value,
  onChange,
}: {
  value: string[];
  onChange: (v: string[]) => void;
}) {
  const [uploading, setUploading] = useState(0);

  const onFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploading(files.length);
    const added: string[] = [];
    for (const file of files) {
      const fd = new FormData();
      fd.append("file", file);
      const res = await uploadImageAction(fd);
      if (res.ok && res.image) added.push(res.image);
      setUploading((n) => n - 1);
    }
    onChange([...value, ...added]);
    e.target.value = "";
  };

  const setMain = (i: number) => {
    const next = [...value];
    const [pick] = next.splice(i, 1);
    onChange([pick, ...next]);
  };
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= value.length) return;
    const next = [...value];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  const remove = (i: number) => onChange(value.filter((_, j) => j !== i));

  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="text-eyebrow text-sage-500">
          Fotos {value.length > 0 && `(${value.length})`}
        </span>
        {value.length > 0 && (
          <span className="text-xs text-ink-soft/50">
            La 1ª es la principal · arrastrá con las flechas
          </span>
        )}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {value.map((url, i) => (
          <div
            key={url + i}
            className={`group relative aspect-[4/3] overflow-hidden rounded-xl border ${
              i === 0 ? "border-moss-600 ring-2 ring-moss-600/30" : "border-moss-600/15"
            }`}
          >
            <Image src={url} alt={`Foto ${i + 1}`} fill className="object-cover" sizes="200px" />
            {i === 0 && (
              <span className="absolute left-1.5 top-1.5 rounded-full bg-moss-600 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-mint-50">
                Principal
              </span>
            )}
            {/* Controls */}
            <div className="absolute inset-0 flex flex-col justify-between bg-gradient-to-t from-moss-900/70 via-transparent to-moss-900/40 p-1.5 opacity-0 transition-opacity group-hover:opacity-100">
              <div className="flex justify-end gap-1">
                <button
                  type="button"
                  onClick={() => remove(i)}
                  className="flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-red-600 hover:bg-white"
                  title="Quitar"
                >
                  ✕
                </button>
              </div>
              <div className="flex items-center justify-between gap-1">
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => move(i, -1)}
                    disabled={i === 0}
                    className="flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-moss-700 disabled:opacity-30"
                    title="Mover antes"
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    onClick={() => move(i, 1)}
                    disabled={i === value.length - 1}
                    className="flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-moss-700 disabled:opacity-30"
                    title="Mover después"
                  >
                    →
                  </button>
                </div>
                {i !== 0 && (
                  <button
                    type="button"
                    onClick={() => setMain(i)}
                    className="rounded-full bg-white/90 px-2 py-1 text-[10px] font-medium text-moss-700 hover:bg-white"
                    title="Hacer principal"
                  >
                    ★ Principal
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Upload tile */}
        <label className="flex aspect-[4/3] cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-moss-600/25 bg-mint-50/40 text-center text-sm text-ink-soft/60 transition-colors hover:bg-mint-100/50">
          {uploading > 0 ? (
            <span>Subiendo {uploading}…</span>
          ) : (
            <>
              <span className="text-2xl leading-none text-moss-600">+</span>
              <span className="px-2 text-xs">Agregar fotos</span>
            </>
          )}
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={onFiles}
            className="hidden"
          />
        </label>
      </div>
      <p className="mt-2 text-xs text-ink-soft/50">
        Podés subir varias a la vez. Se comprimen y optimizan solas.
      </p>
    </div>
  );
}
