"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { uploadImageAction } from "@/app/admin/actions";
import { compressImage } from "@/lib/compress-image";
import { Spinner } from "./ui";
import { toast } from "./Toaster";

/** Subidas en paralelo: rápido sin saturar la conexión del celular. */
const CONCURRENCY = 3;

type Pending = { id: number; preview: string };

export default function ImageManager({
  value,
  onChange,
}: {
  value: string[];
  onChange: React.Dispatch<React.SetStateAction<string[]>>;
}) {
  const [pending, setPending] = useState<Pending[]>([]);
  const [fileOver, setFileOver] = useState(false);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);
  const nextId = useRef(1);
  const previews = useRef<string[]>([]);

  // Libera las vistas previas locales al salir.
  useEffect(() => {
    const urls = previews.current;
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, []);

  const addFiles = async (list: FileList | File[]) => {
    const files = Array.from(list).filter((f) => f.type.startsWith("image/"));
    if (!files.length) {
      toast("Elegí archivos de imagen (JPG, PNG o WebP).", "error");
      return;
    }
    const slots: Pending[] = files.map((f) => {
      const preview = URL.createObjectURL(f);
      previews.current.push(preview);
      return { id: nextId.current++, preview };
    });
    setPending((p) => [...p, ...slots]);

    // Resultado por posición: se agregan en el orden en que se eligieron.
    const results: (string | null | undefined)[] = new Array(files.length);
    let flushed = 0;
    let failed = 0;
    let lastError = "";
    const flush = () => {
      const ready: string[] = [];
      const done: number[] = [];
      while (flushed < files.length && results[flushed] !== undefined) {
        const r = results[flushed];
        if (r) ready.push(r);
        done.push(slots[flushed].id);
        flushed++;
      }
      if (ready.length) onChange((prev) => [...prev, ...ready]);
      if (done.length) setPending((p) => p.filter((s) => !done.includes(s.id)));
    };

    let cursor = 0;
    const worker = async () => {
      while (cursor < files.length) {
        const i = cursor++;
        try {
          const fd = new FormData();
          fd.append("file", await compressImage(files[i]));
          const res = await uploadImageAction(fd);
          if (res.ok && res.image) results[i] = res.image;
          else {
            results[i] = null;
            failed++;
            lastError = res.error ?? "error desconocido";
          }
        } catch {
          results[i] = null;
          failed++;
          lastError = "se cortó la conexión";
        }
        flush();
      }
    };
    await Promise.all(
      Array.from({ length: Math.min(CONCURRENCY, files.length) }, worker)
    );
    if (failed) {
      toast(
        failed === files.length
          ? `No se pudo subir ${failed === 1 ? "la foto" : "ninguna foto"} (${lastError}).`
          : `${failed} de ${files.length} fotos no se subieron (${lastError}).`,
        "error"
      );
    }
  };

  const move = (from: number, to: number) => {
    if (from === to || to < 0 || to >= value.length) return;
    onChange((prev) => {
      const next = [...prev];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
  };
  const remove = (i: number) => onChange((prev) => prev.filter((_, j) => j !== i));

  const isFileDrag = (e: React.DragEvent) => e.dataTransfer.types.includes("Files");

  return (
    <div
      onDragOver={(e) => {
        if (!isFileDrag(e)) return;
        e.preventDefault();
        setFileOver(true);
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setFileOver(false);
      }}
      onDrop={(e) => {
        if (!isFileDrag(e)) return;
        e.preventDefault();
        setFileOver(false);
        void addFiles(e.dataTransfer.files);
      }}
      className={`rounded-2xl transition-shadow ${
        fileOver ? "ring-2 ring-sage-500 ring-offset-4 ring-offset-[#f3f3ec]" : ""
      }`}
    >
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {value.map((url, i) => (
          <div
            key={url}
            draggable
            onDragStart={(e) => {
              setDragIdx(i);
              e.dataTransfer.effectAllowed = "move";
            }}
            onDragOver={(e) => {
              if (dragIdx === null) return;
              e.preventDefault();
              setOverIdx(i);
            }}
            onDrop={(e) => {
              if (dragIdx === null) return;
              e.preventDefault();
              e.stopPropagation();
              move(dragIdx, i);
              setDragIdx(null);
              setOverIdx(null);
            }}
            onDragEnd={() => {
              setDragIdx(null);
              setOverIdx(null);
            }}
            className={`group relative aspect-[4/3] cursor-grab overflow-hidden rounded-xl bg-bone-dark transition-[transform,opacity,box-shadow] active:cursor-grabbing ${
              i === 0 ? "ring-2 ring-sage-600 ring-offset-2 ring-offset-[#f3f3ec]" : ""
            } ${dragIdx === i ? "opacity-40" : ""} ${
              overIdx === i && dragIdx !== i ? "scale-[1.03] shadow-lg" : ""
            }`}
          >
            <Image
              src={url}
              alt={`Foto ${i + 1}`}
              fill
              className="pointer-events-none object-cover"
              sizes="(max-width: 640px) 50vw, 220px"
            />
            {i === 0 && (
              <span className="absolute left-2 top-2 rounded-full bg-moss-900/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-mint-50 backdrop-blur-sm">
                Portada
              </span>
            )}

            {/* Controles: con mouse aparecen al pasar; en pantallas táctiles, siempre. */}
            <div className="absolute inset-0 flex flex-col justify-between bg-gradient-to-t from-moss-900/65 via-transparent to-moss-900/30 p-1.5 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100 [@media(hover:none)]:opacity-100">
              <div className="flex justify-end">
                <TileBtn onClick={() => remove(i)} label={`Quitar foto ${i + 1}`} danger>
                  <path d="M6 6l12 12M18 6 6 18" />
                </TileBtn>
              </div>
              <div className="flex items-center justify-between gap-1">
                <div className="flex gap-1">
                  <TileBtn onClick={() => move(i, i - 1)} label="Mover antes" disabled={i === 0}>
                    <path d="m15 18-6-6 6-6" />
                  </TileBtn>
                  <TileBtn onClick={() => move(i, i + 1)} label="Mover después" disabled={i === value.length - 1}>
                    <path d="m9 18 6-6-6-6" />
                  </TileBtn>
                </div>
                {i !== 0 && (
                  <button
                    type="button"
                    onClick={() => move(i, 0)}
                    className="rounded-full bg-white/92 px-2.5 py-1 text-[11px] font-medium text-moss-700 shadow-sm hover:bg-white"
                  >
                    Usar de portada
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Subiendo: la foto aparece al instante, con su progreso encima. */}
        {pending.map((p) => (
          <div key={p.id} className="relative aspect-[4/3] overflow-hidden rounded-xl bg-bone-dark">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.preview} alt="" className="h-full w-full object-cover opacity-60 blur-[1px]" />
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="flex items-center gap-2 rounded-full bg-moss-900/75 px-3 py-1.5 text-xs text-mint-50 backdrop-blur-sm">
                <Spinner /> Subiendo
              </span>
            </span>
          </div>
        ))}

        {/* Agregar */}
        <label className="flex aspect-[4/3] cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-moss-600/25 bg-white/35 px-3 text-center transition-colors hover:border-moss-600/40 hover:bg-white/70">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="text-sage-600" aria-hidden>
            <rect x="3" y="3" width="18" height="18" rx="3" />
            <path d="M12 8v8M8 12h8" />
          </svg>
          <span className="text-sm font-medium text-moss-700">Agregar fotos</span>
          <span className="hidden text-[11px] text-ink-soft/50 md:block">o arrastralas acá</span>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => {
              if (e.target.files?.length) void addFiles(e.target.files);
              e.target.value = "";
            }}
            className="sr-only"
          />
        </label>
      </div>

      <p className="mt-3 text-xs leading-relaxed text-ink-soft/55">
        {value.length > 1
          ? "La primera es la portada. Arrastrá las fotos para ordenarlas (en el celular, usá las flechas)."
          : "Podés subir varias a la vez, directo desde el celular. Se comprimen solas."}
      </p>
    </div>
  );
}

function TileBtn({
  onClick,
  label,
  disabled,
  danger,
  children,
}: {
  onClick: () => void;
  label: string;
  disabled?: boolean;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={`flex h-8 w-8 items-center justify-center rounded-full bg-white/92 shadow-sm transition-colors hover:bg-white disabled:opacity-30 ${
        danger ? "text-red-600" : "text-moss-700"
      }`}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        {children}
      </svg>
    </button>
  );
}
