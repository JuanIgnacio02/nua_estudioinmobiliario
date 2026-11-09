"use client";

import { useState } from "react";
import Image from "next/image";
import { uploadGenericImageAction } from "@/app/admin/actions";
import { compressImage } from "@/lib/compress-image";
import { Spinner } from "./ui";
import { toast } from "./Toaster";

/** Una sola imagen (foto del equipo, portada de loteo) con subir/cambiar/quitar. */
export default function SingleImageUpload({
  value,
  onChange,
  aspect = "aspect-[4/3]",
  label = "Subir foto",
  removable = true,
}: {
  value?: string;
  onChange: (url: string) => void;
  aspect?: string;
  label?: string;
  removable?: boolean;
}) {
  const [uploading, setUploading] = useState(false);
  const [over, setOver] = useState(false);

  const upload = async (raw: File | undefined) => {
    if (!raw) return;
    if (!raw.type.startsWith("image/")) {
      toast("Ese archivo no es una imagen.", "error");
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", await compressImage(raw));
      const res = await uploadGenericImageAction(fd);
      if (res.ok && res.image) onChange(res.image);
      else toast(res.error ?? "No se pudo subir la foto.", "error");
    } catch {
      toast("No se pudo subir la foto. Revisá la conexión.", "error");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <label
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          void upload(e.dataTransfer.files?.[0]);
        }}
        className={`group relative flex ${aspect} w-full cursor-pointer items-center justify-center overflow-hidden rounded-2xl border text-center transition-colors ${
          value
            ? "border-white/70 bg-bone-dark"
            : "border-dashed border-moss-600/25 bg-white/40 hover:bg-white/70"
        } ${over ? "ring-2 ring-sage-500 ring-offset-2 ring-offset-bone" : ""}`}
      >
        {value && (
          <Image src={value} alt="" fill className="object-cover" sizes="(max-width: 1024px) 100vw, 320px" />
        )}
        <span
          className={`relative flex flex-col items-center gap-1.5 rounded-full px-4 py-2 text-sm transition-opacity ${
            value
              ? "bg-moss-900/70 text-mint-50 opacity-0 backdrop-blur-sm group-hover:opacity-100 [@media(hover:none)]:opacity-100"
              : "text-ink-soft/65"
          } ${uploading ? "!opacity-100" : ""}`}
        >
          {uploading ? (
            <span className="flex items-center gap-2">
              <Spinner /> Subiendo…
            </span>
          ) : value ? (
            "Cambiar foto"
          ) : (
            <>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="text-sage-600" aria-hidden>
                <rect x="3" y="3" width="18" height="18" rx="3" />
                <circle cx="9" cy="9" r="2" />
                <path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21" />
              </svg>
              <span>{label}</span>
              <span className="text-xs text-ink-soft/45">o arrastrala acá</span>
            </>
          )}
        </span>
        <input
          type="file"
          accept="image/*"
          className="sr-only"
          disabled={uploading}
          onChange={(e) => {
            void upload(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
      </label>
      {value && removable && !uploading && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="mt-2 text-xs text-ink-soft/55 transition-colors hover:text-red-600"
        >
          Quitar foto
        </button>
      )}
    </div>
  );
}
