"use client";

import { useTransition } from "react";
import { Spinner, useConfirm } from "./ui";

/** Botón "Borrar" que pide confirmación antes de llamar a la acción. */
export default function DeleteButton({
  action,
  slug,
  name,
  kind,
}: {
  action: (fd: FormData) => Promise<void>;
  slug: string;
  name: string;
  kind: "propiedad" | "loteo";
}) {
  const [dialog, confirm] = useConfirm();
  const [pending, startTransition] = useTransition();

  const onClick = async () => {
    const ok = await confirm({
      title: kind === "loteo" ? "¿Borrar este loteo?" : "¿Borrar esta propiedad?",
      body: (
        <>
          <p>
            <strong className="font-medium text-ink">«{name}»</strong> se borra
            de la web y del panel. No se puede deshacer.
          </p>
          {kind === "propiedad" && (
            <p className="mt-2">
              Si se vendió, podés marcarla como <em>Vendida</em> en vez de
              borrarla: sigue sumando como antecedente.
            </p>
          )}
        </>
      ),
      confirmLabel: "Borrar",
    });
    if (!ok) return;
    const fd = new FormData();
    fd.set("slug", slug);
    startTransition(async () => {
      await action(fd);
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        aria-label={`Borrar ${name}`}
        title="Borrar"
        className="relative z-10 flex h-9 w-9 items-center justify-center rounded-full text-ink-soft/45 transition-colors hover:bg-red-500/10 hover:text-red-600 disabled:cursor-progress"
      >
        {pending ? (
          <Spinner className="text-red-600" />
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6" />
          </svg>
        )}
      </button>
      {dialog}
    </>
  );
}
