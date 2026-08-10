-- Slice 2 (Beginner Research) baseline schema.
-- Tables: research_missions, findings.
-- workspace_id is denormalized onto both tables (rather than joined through
-- ventures) so RLS policies can reuse the same is_workspace_member() helper
-- from 0001_init.sql without a nested subquery through ventures.

create table public.research_missions (
  id uuid primary key default gen_random_uuid(),
  venture_id uuid not null references public.ventures (id) on delete cascade,
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  target_user text,
  geography text,
  status text not null default 'queued'
    check (status in ('queued', 'running', 'complete', 'failed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.research_missions enable row level security;

create index research_missions_venture_id_idx on public.research_missions (venture_id);
create index research_missions_workspace_id_idx on public.research_missions (workspace_id);

create policy "research_missions_select_member"
  on public.research_missions for select
  using (public.is_workspace_member(research_missions.workspace_id));

create policy "research_missions_insert_member"
  on public.research_missions for insert
  with check (public.is_workspace_member(research_missions.workspace_id));

create policy "research_missions_update_member"
  on public.research_missions for update
  using (public.is_workspace_member(research_missions.workspace_id));

create trigger research_missions_set_updated_at
  before update on public.research_missions
  for each row
  execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- findings
-- ---------------------------------------------------------------------
create table public.findings (
  id uuid primary key default gen_random_uuid(),
  mission_id uuid not null references public.research_missions (id) on delete cascade,
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  normalized_claim text not null,
  user_facing_summary text not null,
  -- Evidence-strength state (spec Appendix A.2). Separate from is_demo below:
  -- state describes confidence in the claim, is_demo describes whether the
  -- claim came from a real source at all.
  state text not null default 'UNKNOWN'
    check (state in ('SOLID', 'MIXED', 'WEAK', 'UNKNOWN')),
  -- True until a real, credentialed data source produces this finding.
  -- Demo findings must never be presented as researched fact (spec §22.1);
  -- the UI is required to show this badge whenever it's true.
  is_demo boolean not null default true,
  limitations text,
  next_test text,
  created_at timestamptz not null default now()
);

alter table public.findings enable row level security;

create index findings_mission_id_idx on public.findings (mission_id);
create index findings_workspace_id_idx on public.findings (workspace_id);

create policy "findings_select_member"
  on public.findings for select
  using (public.is_workspace_member(findings.workspace_id));

create policy "findings_insert_member"
  on public.findings for insert
  with check (public.is_workspace_member(findings.workspace_id));
