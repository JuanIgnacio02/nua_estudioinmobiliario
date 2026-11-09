"use client";

import { useTransition } from "react";
import { duplicatePropertyAction } from "@/app/admin/actions";
import { Spinner } from "./ui";

/** Crea una copia en borrador y abre su edición. */
export default function DuplicateButton({
  slug,
  title,
  variant = "icon",
}: {
  slug: string;
  title: string;
  variant?: "icon" | "button";
}) {
  const [pending, startTransition] = useTransition();
  const run = () =>
    startTransition(async () => {
      const fd = new FormData();
      fd.set("slug", slug);
      await duplicatePropertyAction(fd);
    });

  const icon = (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="9" y="9" width="12" height="12" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );

  if (variant === "button") {
    return (
      <button type="button" onClick={run} disabled={pending} className="glass-btn text-xs">
        {pending ? <Spinner /> : icon}
        {pending ? "Duplicando…" : "Duplicar"}
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={run}
      disabled={pending}
      aria-label={`Duplicar ${title}`}
      title="Duplicar (crea una copia en borrador)"
      className="relative z-10 flex h-9 w-9 items-center justify-center rounded-full text-ink-soft/50 transition-colors hover:bg-white/80 hover:text-moss-700 disabled:cursor-progress"
    >
      {pending ? <Spinner /> : icon}
    </button>
  );
}
