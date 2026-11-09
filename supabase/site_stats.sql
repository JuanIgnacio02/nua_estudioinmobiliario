-- ======================================================================
--  Estadísticas de la web: tabla propia + suma atómica
-- ======================================================================
--
--  Cómo correrlo (una sola vez):
--    Supabase → el proyecto → SQL Editor → New query → pegar todo → Run.
--  Se puede volver a correr sin problema: no duplica ni borra nada.
--
--  Por qué: antes los contadores vivían en una fila JSON (site_store, id 2)
--  que se leía, se sumaba y se volvía a guardar. Si dos visitas llegaban al
--  mismo tiempo, una pisaba a la otra y se perdía. Acá cada suma la hace la
--  base en un solo paso (insert … on conflict do update), así no se pierde
--  ninguna.
-- ----------------------------------------------------------------------

-- 1. Tabla: un contador por día, propiedad y tipo de evento.
create table if not exists public.site_stats (
  day   date    not null,
  slug  text    not null,
  kind  text    not null check (kind in ('view', 'whatsapp', 'tasacion')),
  count integer not null default 0 check (count >= 0),
  primary key (day, slug, kind)
);

-- Sin políticas: solo el servidor de la web (service_role) la lee y escribe.
alter table public.site_stats enable row level security;
revoke all on table public.site_stats from anon, authenticated;

-- 2. Suma atómica.
create or replace function public.track_event(p_day date, p_slug text, p_kind text)
returns void
language sql
set search_path = public
as $$
  insert into public.site_stats (day, slug, kind, count)
  values (p_day, p_slug, p_kind, 1)
  on conflict (day, slug, kind)
  do update set count = public.site_stats.count + 1;
$$;

-- Que no la pueda llamar cualquiera con la clave pública.
revoke all on function public.track_event(date, text, text) from public, anon, authenticated;
grant execute on function public.track_event(date, text, text) to service_role;

-- 3. Pasar lo que ya se contó en la fila vieja (site_store id 2).
--    greatest(): si se corre de nuevo, no pisa lo que ya sumó la tabla.
insert into public.site_stats (day, slug, kind, count)
select d.key::date, s.key, k.key, (k.value)::text::int
from public.site_store st
cross join lateral jsonb_each(st.data -> 'days') as d
cross join lateral jsonb_each(d.value) as s
cross join lateral jsonb_each(s.value) as k
where st.id = 2
  and k.key in ('view', 'whatsapp', 'tasacion')
on conflict (day, slug, kind)
do update set count = greatest(public.site_stats.count, excluded.count);

-- 4. Que la API de Supabase vea la tabla y la función nuevas ya mismo.
notify pgrst, 'reload schema';
