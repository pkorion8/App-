-- Sprint product spine: truthful lifecycle values and persisted founder-selected monetization tests.
alter table public.ventures drop constraint if exists ventures_status_check;
alter table public.ventures add constraint ventures_status_check check (status in ('draft','shaped','researching','researched','simulating','simulated','build_ready','learning','built','launched'));
create table public.monetization_experiments (
  id uuid primary key default gen_random_uuid(), venture_id uuid not null references public.ventures(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade, experiment_key text not null,
  hypothesis text not null, deciding_metric text not null, pricing_model_override text check (pricing_model_override in ('subscription','one_time','commission','ad_supported')),
  selected boolean not null default true, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(venture_id,experiment_key)
);
alter table public.monetization_experiments enable row level security;
create policy "monetization_experiments_select_member" on public.monetization_experiments for select using (public.is_workspace_member(workspace_id));
create policy "monetization_experiments_insert_member" on public.monetization_experiments for insert with check (public.is_workspace_member(workspace_id));
create policy "monetization_experiments_update_member" on public.monetization_experiments for update using (public.is_workspace_member(workspace_id));
create trigger monetization_experiments_set_updated_at before update on public.monetization_experiments for each row execute function public.set_updated_at();
