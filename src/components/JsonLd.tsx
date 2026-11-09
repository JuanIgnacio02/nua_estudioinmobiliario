/**
 * Datos estructurados (schema.org) para buscadores y asistentes de IA.
 * `<` se reemplaza por \u003c, como indica la guía de Next: JSON.stringify no
 * sanitiza, y un título con "</script>" podría inyectar HTML.
 */
export default function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\u003c"),
      }}
    />
  );
}
