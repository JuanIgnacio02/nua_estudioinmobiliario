"use client";

import { useFavorites } from "@/lib/favorites";

function Heart({ filled, size = 18 }: { filled: boolean; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7Z" />
    </svg>
  );
}

/**
 * Guardar en favoritas.
 *  - "icon": botón redondo sobre la foto de la tarjeta.
 *  - "pill": botón con texto, para la ficha.
 */
export default function FavoriteButton({
  slug,
  title,
  variant = "icon",
}: {
  slug: string;
  title: string;
  variant?: "icon" | "pill";
}) {
  const { has, toggle } = useFavorites();
  const on = has(slug);
  const label = on ? `Quitar «${title}» de favoritas` : `Guardar «${title}» en favoritas`;

  const onClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggle(slug);
  };

  if (variant === "pill") {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-pressed={on}
        aria-label={label}
        className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-full border px-3 py-2.5 text-sm font-medium transition-colors sm:px-5 ${
          on
            ? "border-moss-600 bg-moss-600 text-mint-50 hover:bg-moss-700"
            : "border-moss-600/20 text-moss-700 hover:bg-mint-100"
        }`}
      >
        <span className={on ? "nua-heart-pop" : ""}>
          <Heart filled={on} size={16} />
        </span>
        {on ? "Guardada" : "Guardar"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      aria-label={label}
      title={on ? "Quitar de favoritas" : "Guardar en favoritas"}
      className={`flex h-10 w-10 items-center justify-center rounded-full backdrop-blur-md transition-all duration-300 ${
        on
          ? "bg-mint-50 text-[#b0413e] shadow-md"
          : "bg-moss-900/35 text-white hover:bg-moss-900/55"
      }`}
    >
      <span className={on ? "nua-heart-pop" : ""}>
        <Heart filled={on} />
      </span>
    </button>
  );
}

export { Heart };
