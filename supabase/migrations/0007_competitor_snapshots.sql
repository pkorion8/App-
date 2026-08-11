-- ---------------------------------------------------------------------
-- Competitor trend tracking. A single Research run only ever sees one
-- moment in time; a trend needs the same competitor checked again later
-- and compared. No new scheduled job needed -- each live App Store
-- search's results are stored here, and the next research run for the
-- same venture compares against whatever was stored before it (matched
-- by Apple's stable numeric app id, not name).
-- ---------------------------------------------------------------------
create table public.research_competitor_snapshots (
  id uuid primary key default gen_random_uuid(),
  venture_id uuid not null references public.ventures (id) on delete cascade,
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  app_id bigint not null,
  app_name text not null,
  rating_count integer not null,
  checked_at timestamptz not null default now()
);

alter table public.research_competitor_snapshots enable row level security;

create index research_competitor_snapshots_venture_app_idx
  on public.research_competitor_snapshots (venture_id, app_id, checked_at desc);

create policy "research_competitor_snapshots_select_member"
  on public.research_competitor_snapshots for select
  using (public.is_workspace_member(research_competitor_snapshots.workspace_id));

create policy "research_competitor_snapshots_insert_member"
  on public.research_competitor_snapshots for insert
  with check (public.is_workspace_member(research_competitor_snapshots.workspace_id));
