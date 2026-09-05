-- Analytics de visitas: datos mínimos, sólo accesibles por la función con service role.
create table if not exists public.visit_events (
  id bigint generated always as identity primary key,
  visited_at timestamptz not null default now(),
  ip_address inet not null,
  user_agent text not null,
  path text not null check (char_length(path) between 1 and 2048),
  country_code text check (country_code is null or country_code ~ '^[A-Z]{2}$')
);
create index if not exists visit_events_visited_at_idx on public.visit_events (visited_at desc);
create index if not exists visit_events_ip_path_visited_at_idx on public.visit_events (ip_address, path, visited_at desc);
alter table public.visit_events enable row level security;
revoke all on table public.visit_events from anon, authenticated;
