-- Persistent venture memory and richer real-world learning metrics.

alter table public.venture_outcomes
  drop constraint if exists venture_outcomes_metric_type_check;

alter table public.venture_outcomes
  add constraint venture_outcomes_metric_type_check
  check (metric_type in ('users','revenue','cost','retention','conversion','activation','churn','qualitative','milestone','other'));

create table if not exists public.venture_notes (
  id uuid primary key default gen_random_uuid(),
  venture_id uuid not null references public.ventures(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  note text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.venture_resources (
  id uuid primary key default gen_random_uuid(),
  venture_id uuid not null references public.ventures(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  title text not null,
  url text,
  resource_type text not null default 'link' check (resource_type in ('link','document','video','tool','other')),
  notes text,
  created_at timestamptz not null default now()
);

alter table public.venture_notes enable row level security;
alter table public.venture_resources enable row level security;

create policy "venture_notes_member" on public.venture_notes for all
  using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));

create policy "venture_resources_member" on public.venture_resources for all
  using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));

create index if not exists venture_notes_venture_id_idx on public.venture_notes(venture_id);
create index if not exists venture_resources_venture_id_idx on public.venture_resources(venture_id);

comment on table public.venture_notes is 'Founder-authored persistent venture memory.';
comment on table public.venture_resources is 'Founder-saved external resources; presence does not imply evidence quality.';
