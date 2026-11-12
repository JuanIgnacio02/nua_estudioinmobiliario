"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Spinner } from "./ui";

/*
 * Material listo para compartir: placas para Instagram (feed e historia) con
 * la foto elegida, y la ficha en PDF. Se abre en una ventana desde un botón
 * (arriba en la edición y en cada fila de la lista), para no tener que bajar
 * hasta el final de la página.
 */

type KitProps = { slug: string; title: string; images: string[]; draft: boolean };

const ShareIcon = ({ size = 15 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <rect x="3" y="3" width="18" height="18" rx="4" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" />
  </svg>
);

/** Botón que abre la ventana con placas y PDF. */
export default function SocialKitButton({
  variant = "button",
  ...kit
}: KitProps & { variant?: "button" | "icon" }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <>
      {variant === "button" ? (
        <button type="button" onClick={() => setOpen(true)} className="glass-btn text-xs">
          <ShareIcon size={14} />
          Redes y PDF
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={`Placas para redes y PDF de ${kit.title}`}
          title="Placas para Instagram y ficha en PDF"
          className="relative z-10 flex h-9 w-9 items-center justify-center rounded-full text-ink-soft/50 transition-colors hover:bg-white/80 hover:text-moss-700"
        >
          <ShareIcon />
        </button>
      )}

      <dialog
        ref={ref}
        onClose={() => setOpen(false)}
        onClick={(e) => {
          if (e.target === ref.current) setOpen(false);
        }}
        aria-label="Placas para redes y ficha en PDF"
        className="admin-dialog max-h-[92vh] w-[min(62rem,calc(100vw-1.5rem))] overflow-y-auto p-0"
      >
        {/* El contenido se arma recién al abrir: las placas no se generan
            hasta que alguien las quiere ver. */}
        {open && <KitContent {...kit} onClose={() => setOpen(false)} />}
      </dialog>
    </>
  );
}

function KitContent({ slug, title, images, draft, onClose }: KitProps & { onClose: () => void }) {
  const [foto, setFoto] = useState(0);
  // Evita que el navegador muestre una placa vieja después de guardar.
  const [version] = useState(() => Date.now());
  const placa = (formato: "feed" | "historia", descargar = false) =>
    `/admin/placas/${slug}?formato=${formato}&foto=${foto}&v=${version}${descargar ? "&descargar=1" : ""}`;

  return (
    <div className="p-5 md:p-7">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="font-sans text-lg font-semibold leading-snug text-ink">Redes y ficha en PDF</p>
          <p className="mt-0.5 line-clamp-1 text-sm text-ink-soft/65">{title}</p>
          <p className="mt-1 text-xs text-ink-soft/55">
            Se arman con los datos guardados: si cambiaste algo, guardá primero.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink-soft/60 transition-colors hover:bg-black/5 hover:text-ink"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>
      </div>

      {images.length > 1 && (
        <div className="mt-5">
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
                  foto === i ? "ring-2 ring-sage-600 ring-offset-2 ring-offset-white" : "opacity-60 hover:opacity-100"
                }`}
              >
                <Image src={src} alt="" fill sizes="80px" className="object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mt-5 grid gap-5 sm:grid-cols-[1fr_0.7fr_1fr]">
        <Preview label="Feed · 1080×1350" src={placa("feed")} download={placa("feed", true)} aspect="aspect-[4/5]" />
        <Preview
          label="Historia · 1080×1920"
          src={placa("historia")}
          download={placa("historia", true)}
          aspect="aspect-[9/16]"
        />

        <div className="flex flex-col justify-between gap-4 rounded-2xl border border-moss-600/10 bg-mint-50/50 p-5">
          <div>
            <p className="text-sm font-semibold text-ink">Ficha en PDF</p>
            <p className="mt-1 text-xs leading-relaxed text-ink-soft/65">
              Fotos, datos, mapa, contacto y un QR a la ficha online. Para mandar
              por mail o imprimir para una visita.
              {draft && " (En borrador: solo la pueden abrir ustedes.)"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a href={`/propiedades/${slug}/ficha`} target="_blank" rel="noopener" className="glass-btn text-xs">
              Ver PDF ↗
            </a>
            <a
              href={`/propiedades/${slug}/ficha?descargar=1`}
              download
              className="glass-btn-primary px-4 py-2 text-xs"
            >
              Descargar
            </a>
          </div>
        </div>
      </div>
    </div>
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
  const [failed, setFailed] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  const url = retry ? `${src}&r=${retry}` : src;
  return (
    <div>
      <div className={`relative ${aspect} overflow-hidden rounded-xl bg-bone-dark`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={url}
          src={url}
          alt={`Vista previa ${label}`}
          onLoad={() => setLoaded(src)}
          onError={() => setFailed(src)}
          className={`h-full w-full object-cover transition-opacity duration-300 ${
            loaded === src ? "opacity-100" : "opacity-0"
          }`}
        />
        {loaded !== src &&
          (failed === src ? (
            <span className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-3 text-center text-xs text-ink-soft/70">
              No se pudo armar la placa.
              <button
                type="button"
                onClick={() => {
                  setFailed(null);
                  setRetry((n) => n + 1);
                }}
                className="glass-btn px-3 py-1.5 text-xs"
              >
                Reintentar
              </button>
            </span>
          ) : (
            <span className="absolute inset-0 flex items-center justify-center gap-2 text-xs text-ink-soft/60">
              <Spinner /> Armando…
            </span>
          ))}
      </div>
      <div className="mt-2 flex items-center justify-between gap-2">
        <span className="text-[11px] text-ink-soft/60">{label}</span>
        {/* `download`: además, el aviso de "cambios sin guardar" no lo frena. */}
        <a href={download} download className="text-xs font-medium text-moss-700 hover:underline">
          Descargar
        </a>
      </div>
    </div>
  );
}
