-- ---------------------------------------------------------------------
-- Shape: the module between "create a venture" and "Research" that
-- ventures.status and packages/domain's VentureStatus type already
-- reserved a 'shaped' value for, but nothing populated until now.
-- ventures.target_user / ventures.geography already exist for this;
-- the richer structured fields (problem, value prop, MVP scope,
-- differentiation) live in their own 1:1 table, same pattern as
-- billing_accounts.
-- ---------------------------------------------------------------------
create table public.venture_shapes (
  id uuid primary key default gen_random_uuid(),
  venture_id uuid not null unique references public.ventures (id) on delete cascade,
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  problem_statement text,
  value_proposition text,
  mvp_scope text,
  differentiation text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.venture_shapes enable row level security;

create index venture_shapes_venture_id_idx on public.venture_shapes (venture_id);

create policy "venture_shapes_select_member"
  on public.venture_shapes for select
  using (public.is_workspace_member(venture_shapes.workspace_id));

create policy "venture_shapes_insert_member"
  on public.venture_shapes for insert
  with check (public.is_workspace_member(venture_shapes.workspace_id));

create policy "venture_shapes_update_member"
  on public.venture_shapes for update
  using (public.is_workspace_member(venture_shapes.workspace_id));

create trigger venture_shapes_set_updated_at
  before update on public.venture_shapes
  for each row
  execute function public.set_updated_at();
