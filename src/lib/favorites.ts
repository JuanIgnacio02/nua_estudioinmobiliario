"use client";

import { useCallback, useSyncExternalStore } from "react";

/*
 * Favoritas del visitante: quedan guardadas en su navegador (sin cuenta ni
 * cookies). Se leen con useSyncExternalStore para que el corazón de todas las
 * tarjetas, la ficha y el contador del menú estén siempre sincronizados,
 * incluso entre pestañas.
 */

const KEY = "nua:favoritas";
const EVENT = "nua:favoritas";

function read(): string {
  try {
    return window.localStorage.getItem(KEY) ?? "[]";
  } catch {
    return "[]";
  }
}

function subscribe(onChange: () => void) {
  const onStorage = (e: StorageEvent) => e.key === KEY && onChange();
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onStorage);
  };
}

// Se compara el texto guardado: si no cambió, React no vuelve a renderizar.
const cache = { raw: "", list: [] as string[] };
function parse(raw: string): string[] {
  if (raw === cache.raw) return cache.list;
  let list: string[] = [];
  try {
    const v = JSON.parse(raw);
    if (Array.isArray(v)) list = v.filter((x): x is string => typeof x === "string");
  } catch {
    /* dato roto: se ignora */
  }
  cache.raw = raw;
  cache.list = list;
  return list;
}

function write(list: string[]) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* navegación privada sin almacenamiento: no se guarda, sin romper */
  }
  window.dispatchEvent(new Event(EVENT));
}

export function useFavorites() {
  const raw = useSyncExternalStore(subscribe, read, () => "[]");
  const favorites = parse(raw);

  const toggle = useCallback((slug: string) => {
    const now = parse(read());
    write(now.includes(slug) ? now.filter((s) => s !== slug) : [slug, ...now]);
  }, []);

  const clear = useCallback(() => write([]), []);

  return {
    favorites,
    has: (slug: string) => favorites.includes(slug),
    toggle,
    clear,
  };
}
