"use client";

import { useState } from "react";

export default function TagInput({
  label,
  value,
  onChange,
  placeholder,
  suggestions = [],
}: {
  label: string;
  value: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
  suggestions?: string[];
}) {
  const [draft, setDraft] = useState("");

  const add = (raw: string) => {
    const v = raw.trim();
    if (v && !value.includes(v)) onChange([...value, v]);
    setDraft("");
  };

  return (
    <div>
      <span className="admin-label">{label}</span>
      <div className="mt-2 flex min-h-[2.9rem] flex-wrap items-center gap-1.5 rounded-[0.85rem] border border-white/70 bg-white/55 p-1.5 shadow-[inset_0_1px_2px_rgba(36,41,15,0.05)] transition-shadow focus-within:border-celadon-400 focus-within:bg-white/85 focus-within:shadow-[0_0_0_4px_rgba(172,178,151,0.35)]">
        {value.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-full bg-mint-100 py-1 pl-3 pr-1 text-sm text-moss-700"
          >
            {tag}
            <button
              type="button"
              onClick={() => onChange(value.filter((t) => t !== tag))}
              className="flex h-5 w-5 items-center justify-center rounded-full text-moss-600 transition-colors hover:bg-moss-600 hover:text-mint-50"
              aria-label={`Quitar ${tag}`}
            >
              ×
            </button>
          </span>
        ))}
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              add(draft);
            } else if (e.key === "Backspace" && !draft && value.length) {
              onChange(value.slice(0, -1));
            }
          }}
          onBlur={() => draft && add(draft)}
          placeholder={value.length ? "" : placeholder ?? "Escribí y Enter…"}
          aria-label={label}
          enterKeyHint="done"
          className="min-w-[8rem] flex-1 bg-transparent px-2 py-1 text-sm outline-none"
        />
      </div>
      {suggestions.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {suggestions
            .filter((s) => !value.includes(s))
            .map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => add(s)}
                className="rounded-full border border-moss-600/15 bg-white/30 px-3 py-1 text-xs text-ink-soft transition-colors hover:bg-white/80 hover:text-moss-700"
              >
                + {s}
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
