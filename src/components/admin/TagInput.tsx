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
      <span className="text-eyebrow text-sage-500">{label}</span>
      <div className="mt-2 flex flex-wrap gap-2 rounded-xl border border-moss-600/15 bg-white/60 p-2">
        {value.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1.5 rounded-full bg-mint-100 py-1 pl-3 pr-1.5 text-sm text-moss-700"
          >
            {tag}
            <button
              type="button"
              onClick={() => onChange(value.filter((t) => t !== tag))}
              className="flex h-4 w-4 items-center justify-center rounded-full text-moss-600 hover:bg-moss-600 hover:text-mint-50"
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
          placeholder={placeholder ?? "Escribí y Enter…"}
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
                className="rounded-full border border-moss-600/15 px-3 py-1 text-xs text-ink-soft transition-colors hover:bg-mint-100"
              >
                + {s}
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
