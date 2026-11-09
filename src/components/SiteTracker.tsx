"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { propertySlugFromPath, track } from "@/lib/track";

/**
 * Cuenta visitas a cada ficha y clics en cualquier botón de WhatsApp del
 * sitio. Anónimo: sin cookies ni datos personales. El admin no se cuenta.
 */
export default function SiteTracker() {
  const pathname = usePathname();
  const slug = propertySlugFromPath(pathname);
  const isAdmin = pathname?.startsWith("/admin");

  useEffect(() => {
    if (slug) track("view", slug);
  }, [slug]);

  useEffect(() => {
    if (isAdmin) return;
    const onClick = (e: MouseEvent) => {
      // wa.me/<número> = consulta. wa.me/?text= es "compartir": no cuenta.
      const a = (e.target as Element | null)?.closest?.(
        'a[href^="https://wa.me/"]:not([href^="https://wa.me/?"])'
      );
      if (a) track("whatsapp", propertySlugFromPath(window.location.pathname));
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [isAdmin]);

  return null;
}
