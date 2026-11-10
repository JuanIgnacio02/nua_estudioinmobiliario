-- ======================================================================
--  Bandeja de consultas: lo que llega por los formularios de la web
-- ======================================================================
--
--  Cómo correrlo (una sola vez):
--    Supabase → el proyecto → SQL Editor → New query → pegar todo → Run.
--  Se puede volver a correr sin problema.
--
--  Cada consulta (ficha de una propiedad, contacto o tasación) queda como
--  una fila. Así dos consultas al mismo tiempo nunca se pisan.
-- ----------------------------------------------------------------------

create table if not exists public.site_leads (
  id            uuid        primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  kind          text        not null check (kind in ('consulta', 'contacto', 'tasacion')),
  name          text,
  phone         text,
  email         text,
  message       text,
  property_slug text,
  property_title text,
  -- Tasación: tipo, para qué, ubicación, superficie.
  details       jsonb       not null default '{}'::jsonb,
  status        text        not null default 'nueva'
                check (status in ('nueva', 'contactada', 'cerrada', 'descartada')),
  notes         text
);

create index if not exists site_leads_created_at_idx on public.site_leads (created_at desc);

-- Datos personales: sin políticas, solo el servidor de la web (service_role)
-- puede leer y escribir. Con la clave pública no se ve nada.
alter table public.site_leads enable row level security;
revoke all on table public.site_leads from anon, authenticated;

-- Pasar lo que haya entrado antes de crear la tabla (fila site_store id 3).
insert into public.site_leads
  (id, created_at, updated_at, kind, name, phone, email, message,
   property_slug, property_title, details, status, notes)
select
  (l ->> 'id')::uuid,
  (l ->> 'createdAt')::timestamptz,
  coalesce((l ->> 'updatedAt')::timestamptz, (l ->> 'createdAt')::timestamptz),
  l ->> 'kind',
  l ->> 'name',
  l ->> 'phone',
  l ->> 'email',
  l ->> 'message',
  l ->> 'propertySlug',
  l ->> 'propertyTitle',
  coalesce(l -> 'details', '{}'::jsonb),
  coalesce(l ->> 'status', 'nueva'),
  l ->> 'notes'
from public.site_store st
cross join lateral jsonb_array_elements(coalesce(st.data -> 'leads', '[]'::jsonb)) as l
where st.id = 3
on conflict (id) do nothing;

notify pgrst, 'reload schema';
