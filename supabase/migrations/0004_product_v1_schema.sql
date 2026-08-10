-- Day 1 of the 14-day plan: structural schema for every remaining major
-- module (Simulator, Compare, Build Studio, Monitoring/Outcomes, Billing).
-- This is breadth, not depth -- tables exist and are RLS-correct so the
-- rest of the product can be built against a stable foundation; the
-- simulator's actual event/decision logic lands in a later pass.
--
-- All venture-scoped tables follow the same pattern as
-- 0002_research.sql: workspace_id denormalized, RLS via
-- is_workspace_member() from 0001_init.sql.

-- ---------------------------------------------------------------------
-- Simulator
-- ---------------------------------------------------------------------
create table public.simulation_runs (
  id uuid primary key default gen_random_uuid(),
  venture_id uuid not null references public.ventures (id) on delete cascade,
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  status text not null default 'setup'
    check (status in ('setup', 'running', 'complete', 'abandoned')),
  stage text not null default 'setup'
    check (stage in (
      'setup', 'resource_planning', 'build', 'build_event', 'mvp_ready',
      'pre_launch', 'launch', 'first_users', 'user_or_market_event',
      'adaptation', 'month_1', 'complete'
    )),
  -- Persistent state, per venture-sandbox's own "Day 16, Cash $382,
  -- Build 76%, Users 127..." model. Kept as real columns (not a JSON
  -- blob) so state is queryable and constrainable, not a black box.
  virtual_day integer not null default 0,
  cash_remaining numeric not null default 0,
  budget_total numeric not null default 0,
  build_progress_pct integer not null default 0 check (build_progress_pct between 0 and 100),
  product_quality_pct integer not null default 50 check (product_quality_pct between 0 and 100),
  technical_risk text not null default 'medium' check (technical_risk in ('low', 'medium', 'high')),
  launch_readiness_pct integer not null default 0 check (launch_readiness_pct between 0 and 100),
  total_users integer not null default 0,
  returning_users integer not null default 0,
  monthly_revenue numeric not null default 0,
  monthly_cost numeric not null default 0,
  market_confidence text not null default 'unknown'
    check (market_confidence in ('unknown', 'weak', 'mixed', 'strong')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.simulation_runs enable row level security;

create index simulation_runs_venture_id_idx on public.simulation_runs (venture_id);
create index simulation_runs_workspace_id_idx on public.simulation_runs (workspace_id);

create policy "simulation_runs_select_member"
  on public.simulation_runs for select
  using (public.is_workspace_member(simulation_runs.workspace_id));

create policy "simulation_runs_insert_member"
  on public.simulation_runs for insert
  with check (public.is_workspace_member(simulation_runs.workspace_id));

create policy "simulation_runs_update_member"
  on public.simulation_runs for update
  using (public.is_workspace_member(simulation_runs.workspace_id));

create trigger simulation_runs_set_updated_at
  before update on public.simulation_runs
  for each row
  execute function public.set_updated_at();

-- Append-only history of what happened during a run -- both system-
-- generated events (market/technical) and the state deltas they caused.
-- This is what lets the product later say "you skipped testing on day
-- 11, this may be why activation is weak now."
create table public.simulation_events (
  id uuid primary key default gen_random_uuid(),
  simulation_run_id uuid not null references public.simulation_runs (id) on delete cascade,
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  virtual_day integer not null,
  event_type text not null
    check (event_type in ('build', 'technical', 'market', 'user', 'competitor', 'decision_effect')),
  description text not null,
  effect jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.simulation_events enable row level security;

create index simulation_events_run_id_idx on public.simulation_events (simulation_run_id);

create policy "simulation_events_select_member"
  on public.simulation_events for select
  using (public.is_workspace_member(simulation_events.workspace_id));

create policy "simulation_events_insert_member"
  on public.simulation_events for insert
  with check (public.is_workspace_member(simulation_events.workspace_id));

-- User decisions at each checkpoint -- separate from simulation_events
-- (system-caused) so the UI can distinguish "this happened to you" from
-- "you chose this."
create table public.simulation_decisions (
  id uuid primary key default gen_random_uuid(),
  simulation_run_id uuid not null references public.simulation_runs (id) on delete cascade,
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  virtual_day integer not null,
  decision_type text not null,
  choice text not null,
  immediate_effect text,
  delayed_effect_note text,
  created_at timestamptz not null default now()
);

alter table public.simulation_decisions enable row level security;

create index simulation_decisions_run_id_idx on public.simulation_decisions (simulation_run_id);

create policy "simulation_decisions_select_member"
  on public.simulation_decisions for select
  using (public.is_workspace_member(simulation_decisions.workspace_id));

create policy "simulation_decisions_insert_member"
  on public.simulation_decisions for insert
  with check (public.is_workspace_member(simulation_decisions.workspace_id));

-- V1 branching: a checkpoint is a saved snapshot of simulation_runs'
-- state columns (as jsonb) at a point in time. "Rewind" / "try a
-- different path" = create a new simulation_run seeded from a
-- checkpoint's state rather than a from-scratch git-like branch model.
create table public.simulation_checkpoints (
  id uuid primary key default gen_random_uuid(),
  simulation_run_id uuid not null references public.simulation_runs (id) on delete cascade,
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  virtual_day integer not null,
  label text,
  state_snapshot jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.simulation_checkpoints enable row level security;

create index simulation_checkpoints_run_id_idx on public.simulation_checkpoints (simulation_run_id);

create policy "simulation_checkpoints_select_member"
  on public.simulation_checkpoints for select
  using (public.is_workspace_member(simulation_checkpoints.workspace_id));

create policy "simulation_checkpoints_insert_member"
  on public.simulation_checkpoints for insert
  with check (public.is_workspace_member(simulation_checkpoints.workspace_id));

-- ---------------------------------------------------------------------
-- Compare (two ventures compared side by side)
-- ---------------------------------------------------------------------
create table public.venture_comparisons (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  venture_id_a uuid not null references public.ventures (id) on delete cascade,
  venture_id_b uuid not null references public.ventures (id) on delete cascade,
  summary text,
  created_at timestamptz not null default now(),
  constraint venture_comparisons_distinct check (venture_id_a <> venture_id_b)
);

alter table public.venture_comparisons enable row level security;

create index venture_comparisons_workspace_id_idx on public.venture_comparisons (workspace_id);

create policy "venture_comparisons_select_member"
  on public.venture_comparisons for select
  using (public.is_workspace_member(venture_comparisons.workspace_id));

create policy "venture_comparisons_insert_member"
  on public.venture_comparisons for insert
  with check (public.is_workspace_member(venture_comparisons.workspace_id));

-- ---------------------------------------------------------------------
-- Build Studio
-- ---------------------------------------------------------------------
create table public.build_packages (
  id uuid primary key default gen_random_uuid(),
  venture_id uuid not null references public.ventures (id) on delete cascade,
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  recommended_stack jsonb not null default '{}'::jsonb,
  backlog jsonb not null default '[]'::jsonb,
  cost_estimate jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.build_packages enable row level security;

create index build_packages_venture_id_idx on public.build_packages (venture_id);

create policy "build_packages_select_member"
  on public.build_packages for select
  using (public.is_workspace_member(build_packages.workspace_id));

create policy "build_packages_insert_member"
  on public.build_packages for insert
  with check (public.is_workspace_member(build_packages.workspace_id));

-- ---------------------------------------------------------------------
-- Monitoring / real outcomes (Continuity)
-- ---------------------------------------------------------------------
create table public.venture_outcomes (
  id uuid primary key default gen_random_uuid(),
  venture_id uuid not null references public.ventures (id) on delete cascade,
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  reported_at timestamptz not null default now(),
  metric_type text not null
    check (metric_type in ('users', 'revenue', 'cost', 'retention', 'other')),
  metric_value numeric,
  note text,
  source text not null default 'manual' check (source in ('manual', 'import')),
  created_at timestamptz not null default now()
);

alter table public.venture_outcomes enable row level security;

create index venture_outcomes_venture_id_idx on public.venture_outcomes (venture_id);

create policy "venture_outcomes_select_member"
  on public.venture_outcomes for select
  using (public.is_workspace_member(venture_outcomes.workspace_id));

create policy "venture_outcomes_insert_member"
  on public.venture_outcomes for insert
  with check (public.is_workspace_member(venture_outcomes.workspace_id));

-- ---------------------------------------------------------------------
-- Billing
-- ---------------------------------------------------------------------
create table public.billing_accounts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null unique references public.workspaces (id) on delete cascade,
  plan text not null default 'free' check (plan in ('free', 'pro')),
  status text not null default 'active' check (status in ('active', 'past_due', 'canceled')),
  stripe_customer_id text,
  stripe_subscription_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.billing_accounts enable row level security;

create policy "billing_accounts_select_member"
  on public.billing_accounts for select
  using (public.is_workspace_member(billing_accounts.workspace_id));

create trigger billing_accounts_set_updated_at
  before update on public.billing_accounts
  for each row
  execute function public.set_updated_at();

-- No insert/update policy for regular users: billing rows are created by
-- the handle_new_user trigger (below) and mutated only by webhook/service
-- code, same pattern as creator_claims.

create table public.usage_ledger (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  action_type text not null,
  quantity integer not null default 1,
  created_at timestamptz not null default now()
);

alter table public.usage_ledger enable row level security;

create index usage_ledger_workspace_id_idx on public.usage_ledger (workspace_id);

create policy "usage_ledger_select_member"
  on public.usage_ledger for select
  using (public.is_workspace_member(usage_ledger.workspace_id));

-- ---------------------------------------------------------------------
-- Give every new workspace a free billing_accounts row automatically,
-- same trigger that already bootstraps the workspace itself.
-- ---------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_workspace_id uuid;
begin
  insert into public.workspaces (name, owner_id)
  values (coalesce(new.email, 'My workspace'), new.id)
  returning id into new_workspace_id;

  insert into public.workspace_members (workspace_id, user_id, role)
  values (new_workspace_id, new.id, 'owner');

  insert into public.billing_accounts (workspace_id)
  values (new_workspace_id);

  return new;
end;
$$;
