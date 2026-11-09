"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { saveFeaturedOrderAction } from "@/app/admin/actions";
import { toast } from "./Toaster";
import { Spinner } from "./ui";

type Item = { slug: string; title: string; image: string };

/** Orden de las destacadas en la portada: arrastrar o usar las flechas. */
export default function FeaturedOrder({ items: initial }: { items: Item[] }) {
  const [items, setItems] = useState(initial);
  const [drag, setDrag] = useState<number | null>(null);
  const [pending, startTransition] = useTransition();
  const dirty = items.some((it, i) => it.slug !== initial[i]?.slug);

  const move = (from: number, to: number) => {
    if (to < 0 || to >= items.length || from === to) return;
    setItems((list) => {
      const next = [...list];
      const [it] = next.splice(from, 1);
      next.splice(to, 0, it);
      return next;
    });
  };

  const save = () =>
    startTransition(async () => {
      const res = await saveFeaturedOrderAction(items.map((i) => i.slug));
      if (res.ok) toast("Orden de la portada guardado");
      else toast(res.error ?? "No se pudo guardar el orden", "error");
    });

  if (items.length === 0) {
    return (
      <p className="text-sm text-ink-soft/60">
        No hay propiedades destacadas. Marcá «Destacada en portada» en las que
        quieras mostrar en el inicio.
      </p>
    );
  }

  return (
    <div>
      <ol className="space-y-2">
        {items.map((it, i) => (
          <li
            key={it.slug}
            draggable
            onDragStart={() => setDrag(i)}
            onDragOver={(e) => {
              e.preventDefault();
              if (drag != null && drag !== i) {
                move(drag, i);
                setDrag(i);
              }
            }}
            onDragEnd={() => setDrag(null)}
            className={`flex cursor-grab items-center gap-3 rounded-xl border bg-white/60 p-2 pr-2.5 transition-shadow active:cursor-grabbing ${
              drag === i ? "border-sage-500 shadow-md" : "border-white/70"
            }`}
          >
            <span className="w-5 text-center font-display text-sm text-sage-500">{i + 1}</span>
            <span className="relative h-10 w-14 shrink-0 overflow-hidden rounded-lg bg-bone-dark">
              <Image src={it.image} alt="" fill sizes="56px" className="pointer-events-none object-cover" />
            </span>
            <Link
              href={`/admin/propiedades/${it.slug}`}
              className="line-clamp-1 min-w-0 flex-1 text-sm text-ink hover:text-moss-700"
              draggable={false}
            >
              {it.title}
            </Link>
            <span className="flex shrink-0 gap-1">
              <button
                type="button"
                onClick={() => move(i, i - 1)}
                disabled={i === 0}
                aria-label={`Subir ${it.title}`}
                className="flex h-8 w-8 items-center justify-center rounded-full text-moss-700 transition-colors hover:bg-white disabled:opacity-25"
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => move(i, i + 1)}
                disabled={i === items.length - 1}
                aria-label={`Bajar ${it.title}`}
                className="flex h-8 w-8 items-center justify-center rounded-full text-moss-700 transition-colors hover:bg-white disabled:opacity-25"
              >
                ↓
              </button>
            </span>
          </li>
        ))}
      </ol>
      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="text-xs text-ink-soft/55">Arrastrá para ordenar. La primera va arriba a la izquierda.</p>
        <button
          type="button"
          onClick={save}
          disabled={!dirty || pending}
          className="glass-btn-primary shrink-0 px-4 py-2 text-xs"
        >
          {pending && <Spinner />}
          {pending ? "Guardando…" : "Guardar orden"}
        </button>
      </div>
    </div>
  );
}
