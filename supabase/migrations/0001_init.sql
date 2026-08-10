-- Slice 1 (Foundation) baseline schema.
-- Tables: workspaces, workspace_members, ventures, audit_log.
-- Every table is scoped by Row Level Security to the requesting user's
-- workspace membership; there is no service-role bypass in application code.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- workspaces
-- ---------------------------------------------------------------------
create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.workspaces enable row level security;

create table public.workspace_members (
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  created_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

alter table public.workspace_members enable row level security;

-- Membership check used by every policy below. This must be SECURITY DEFINER:
-- a plain USING clause on workspace_members that queries workspace_members
-- itself sends RLS into infinite recursion (the select policy has to
-- evaluate itself to evaluate itself). Running the lookup as the function
-- owner (which has BYPASSRLS as the migration role) breaks that cycle.
create function public.is_workspace_member(target_workspace_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.workspace_members m
    where m.workspace_id = target_workspace_id
      and m.user_id = auth.uid()
  );
$$;

-- A user can see workspaces they belong to.
create policy "workspaces_select_member"
  on public.workspaces for select
  using (public.is_workspace_member(workspaces.id));

-- Workspaces are created by the handle_new_user trigger (security definer),
-- not directly by client inserts, so no insert policy is granted here.

-- A user can see their own membership rows (and fellow members of the same workspace).
create policy "workspace_members_select_same_workspace"
  on public.workspace_members for select
  using (public.is_workspace_member(workspace_members.workspace_id));

-- ---------------------------------------------------------------------
-- ventures
-- ---------------------------------------------------------------------
create table public.ventures (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  name text not null,
  raw_idea_text text not null,
  target_user text,
  geography text,
  status text not null default 'draft'
    check (status in ('draft', 'researching', 'shaped', 'simulating', 'built', 'launched')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.ventures enable row level security;

create index ventures_workspace_id_idx on public.ventures (workspace_id);

create policy "ventures_select_member"
  on public.ventures for select
  using (public.is_workspace_member(ventures.workspace_id));

create policy "ventures_insert_member"
  on public.ventures for insert
  with check (public.is_workspace_member(ventures.workspace_id));

create policy "ventures_update_member"
  on public.ventures for update
  using (public.is_workspace_member(ventures.workspace_id));

create function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger ventures_set_updated_at
  before update on public.ventures
  for each row
  execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- audit_log (append-only)
-- ---------------------------------------------------------------------
create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null references auth.users (id) on delete cascade,
  workspace_id uuid references public.workspaces (id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.audit_log enable row level security;

create index audit_log_workspace_id_idx on public.audit_log (workspace_id);

create policy "audit_log_select_member"
  on public.audit_log for select
  using (
    workspace_id is null
    or public.is_workspace_member(audit_log.workspace_id)
  );

create policy "audit_log_insert_self"
  on public.audit_log for insert
  with check (actor_id = auth.uid());

-- No update/delete policies: audit_log is append-only by omission.

-- ---------------------------------------------------------------------
-- New user -> personal workspace bootstrap
-- ---------------------------------------------------------------------
create function public.handle_new_user()
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

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();
