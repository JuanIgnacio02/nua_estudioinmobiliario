# NÚA Estudio Inmobiliario

## Base de datos (Supabase)

- `site_store`: el catálogo (fila `id = 1`: propiedades, loteos y configuración).
- `site_stats`: estadísticas anónimas de la web (visitas a fichas, clics de
  WhatsApp, pedidos de tasación). Se crea corriendo **una vez**
  [`supabase/site_stats.sql`](supabase/site_stats.sql) en el SQL Editor de
  Supabase. Mientras no exista, los contadores se guardan en la fila
  `site_store` `id = 2` (formato anterior); el SQL los pasa a la tabla nueva.
- `site_leads`: la bandeja de consultas (formularios de la web). Se crea
  corriendo **una vez** [`supabase/site_leads.sql`](supabase/site_leads.sql).
  Mientras no exista, se guardan en la fila `site_store` `id = 3`.
- Un workflow diario (`.github/workflows/keep-alive.yml`) consulta la base para
  que el plan gratuito no la pause.

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
