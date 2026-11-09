"use client";

import { useState } from "react";
import Image from "next/image";
import { Panel, Spinner } from "./ui";

/**
 * Material listo para compartir: placas para Instagram (feed e historia) con
 * la foto elegida, y la ficha en PDF. Se arma con los datos guardados.
 */
export default function SocialKit({
  slug,
  images,
  draft,
}: {
  slug: string;
  images: string[];
  draft: boolean;
}) {
  const [foto, setFoto] = useState(0);
  // Evita que el navegador muestre una placa vieja después de guardar.
  const [version] = useState(() => Date.now());
  const placa = (formato: "feed" | "historia", descargar = false) =>
    `/admin/placas/${slug}?formato=${formato}&foto=${foto}&v=${version}${descargar ? "&descargar=1" : ""}`;

  return (
    <Panel
      title="Para redes y clientes"
      description="Placas listas para Instagram y la ficha en PDF. Se arman con los datos guardados: si cambiaste algo, guardá primero."
      className="mt-10"
    >
      {images.length > 1 && (
        <div className="mb-5">
          <span className="admin-label">Foto de la placa</span>
          <div className="no-scrollbar mt-2 flex gap-2 overflow-x-auto pb-1">
            {images.map((src, i) => (
              <button
                key={src + i}
                type="button"
                onClick={() => setFoto(i)}
                aria-pressed={foto === i}
                aria-label={`Usar la foto ${i + 1}`}
                className={`relative h-14 w-20 shrink-0 overflow-hidden rounded-lg transition ${
                  foto === i ? "ring-2 ring-sage-600 ring-offset-2 ring-offset-[#f3f3ec]" : "opacity-60 hover:opacity-100"
                }`}
              >
                <Image src={src} alt="" fill sizes="80px" className="object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-[1fr_0.7fr_1fr]">
        <Preview
          label="Feed · 1080×1350"
          src={placa("feed")}
          download={placa("feed", true)}
          aspect="aspect-[4/5]"
        />
        <Preview
          label="Historia · 1080×1920"
          src={placa("historia")}
          download={placa("historia", true)}
          aspect="aspect-[9/16]"
        />

        <div className="flex flex-col justify-between gap-4 rounded-2xl border border-moss-600/10 bg-white/40 p-5">
          <div>
            <p className="text-sm font-semibold text-ink">Ficha en PDF</p>
            <p className="mt-1 text-xs leading-relaxed text-ink-soft/65">
              Fotos, datos, mapa, contacto y un QR a la ficha online. Para
              mandar por mail o imprimir para una visita.
              {draft && " (En borrador: solo la pueden abrir ustedes.)"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a
              href={`/propiedades/${slug}/ficha`}
              target="_blank"
              rel="noopener"
              className="glass-btn text-xs"
            >
              Ver PDF ↗
            </a>
            <a href={`/propiedades/${slug}/ficha?descargar=1`} className="glass-btn-primary px-4 py-2 text-xs">
              Descargar
            </a>
          </div>
        </div>
      </div>
    </Panel>
  );
}

function Preview({
  label,
  src,
  download,
  aspect,
}: {
  label: string;
  src: string;
  download: string;
  aspect: string;
}) {
  const [loaded, setLoaded] = useState<string | null>(null);
  return (
    <div>
      <div className={`relative ${aspect} overflow-hidden rounded-xl bg-bone-dark`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={`Vista previa ${label}`}
          onLoad={() => setLoaded(src)}
          className={`h-full w-full object-cover transition-opacity duration-300 ${
            loaded === src ? "opacity-100" : "opacity-0"
          }`}
        />
        {loaded !== src && (
          <span className="absolute inset-0 flex items-center justify-center gap-2 text-xs text-ink-soft/60">
            <Spinner /> Armando…
          </span>
        )}
      </div>
      <div className="mt-2 flex items-center justify-between gap-2">
        <span className="text-[11px] text-ink-soft/60">{label}</span>
        <a href={download} className="text-xs font-medium text-moss-700 hover:underline">
          Descargar
        </a>
      </div>
    </div>
  );
}
