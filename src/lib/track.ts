/**
 * Avisa al servidor de una visita o un clic (anónimo). Usa sendBeacon: no
 * frena la navegación ni la apertura de WhatsApp.
 */
export function track(kind: "view" | "whatsapp" | "tasacion", slug?: string | null) {
  try {
    const body = JSON.stringify({ kind, slug: slug ?? undefined });
    const blob = new Blob([body], { type: "application/json" });
    if (navigator.sendBeacon?.("/api/track", blob)) return;
    void fetch("/api/track", { method: "POST", body, keepalive: true, headers: { "Content-Type": "application/json" } });
  } catch {
    /* las estadísticas nunca rompen la página */
  }
}

/** Slug de la ficha si la URL es /propiedades/<slug>. */
export function propertySlugFromPath(pathname: string | null) {
  const m = pathname?.match(/^\/propiedades\/([a-z0-9-]+)\/?$/);
  return m ? m[1] : null;
}

/**
 * Guarda una consulta en la bandeja del admin (en segundo plano: WhatsApp se
 * abre igual y al instante). `empresa` es la trampa para robots.
 */
export function sendLead(lead: {
  kind: "consulta" | "contacto" | "tasacion";
  name?: string;
  phone?: string;
  email?: string;
  message?: string;
  slug?: string | null;
  details?: Record<string, string>;
  empresa?: string;
}) {
  try {
    const body = JSON.stringify(lead);
    const blob = new Blob([body], { type: "application/json" });
    if (navigator.sendBeacon?.("/api/leads", blob)) return;
    void fetch("/api/leads", { method: "POST", body, keepalive: true, headers: { "Content-Type": "application/json" } });
  } catch {
    /* nunca frena el envío por WhatsApp */
  }
}
