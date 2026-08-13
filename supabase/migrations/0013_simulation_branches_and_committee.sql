-- Pass 3: explicit simulation branches / rewind policy plus persisted committee reviews.

alter table public.simulation_runs
  add column if not exists parent_run_id uuid references public.simulation_runs(id) on delete set null,
  add column if not exists branch_origin_checkpoint_id uuid references public.simulation_checkpoints(id) on delete set null,
  add column if not exists rewind_count integer not null default 0 check (rewind_count >= 0 and rewind_count <= 3),
  add column if not exists reality_mode boolean not null default false,
  add column if not exists branch_label text;

create index if not exists simulation_runs_parent_run_id_idx on public.simulation_runs(parent_run_id);

create table if not exists public.investment_committee_reviews (
  id uuid primary key default gen_random_uuid(),
  investor_session_id uuid not null references public.investor_sessions(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  outcome text not null check (outcome in ('more_evidence','pass','conditional_interest','partner_meeting','term_sheet')),
  rationale jsonb not null default '{}'::jsonb,
  missing_evidence text[] not null default '{}',
  created_at timestamptz not null default now()
);

alter table public.investment_committee_reviews enable row level security;

create policy "investment_committee_reviews_member"
  on public.investment_committee_reviews
  for all
  using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));

comment on column public.simulation_runs.reality_mode is 'When true, timeline rewinds are disabled for this run and descendants.';
comment on column public.simulation_runs.rewind_count is 'Number of alternate timeline branches already created in this lineage; capped at three outside Reality Mode.';
comment on table public.investment_committee_reviews is 'Persisted simulated committee outcomes; never represents a real investor decision.';
