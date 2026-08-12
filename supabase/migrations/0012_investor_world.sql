-- Investor World rehearsal state. All records are founder-entered or simulated; none represent real investor interest.

create table public.investor_sessions (
  id uuid primary key default gen_random_uuid(),
  venture_id uuid not null references public.ventures(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  investor_profile text not null,
  stage text not null default 'screening' check (stage in ('readiness','screening','meeting','diligence','committee','negotiation','closed','passed')),
  question_index integer not null default 0,
  qualitative_state jsonb not null default '{}'::jsonb,
  outcome_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.investor_messages (
  id uuid primary key default gen_random_uuid(),
  investor_session_id uuid not null references public.investor_sessions(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  role text not null check (role in ('investor','founder','system')),
  message text not null,
  created_at timestamptz not null default now()
);

create table public.investor_claims (
  id uuid primary key default gen_random_uuid(),
  investor_session_id uuid not null references public.investor_sessions(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  claim_text text not null,
  claim_state text not null check (claim_state in ('SUPPORTED','PARTIAL','ASSUMPTION','CONTRADICTED','NEW CLAIM','UNKNOWN')),
  evidence_finding_id uuid references public.findings(id) on delete set null,
  investor_concern text,
  created_at timestamptz not null default now()
);

create table public.investor_offers (
  id uuid primary key default gen_random_uuid(),
  investor_session_id uuid not null references public.investor_sessions(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  instrument text not null default 'equity',
  offer_state text not null default 'draft' check (offer_state in ('draft','offered','countered','accepted','declined','withdrawn')),
  investment_amount numeric not null,
  pre_money_valuation numeric not null,
  terms jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.diligence_items (
  id uuid primary key default gen_random_uuid(),
  investor_session_id uuid not null references public.investor_sessions(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  category text not null,
  item text not null,
  state text not null default 'missing' check (state in ('ready','partial','missing','not_applicable')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.investor_sessions enable row level security;
alter table public.investor_messages enable row level security;
alter table public.investor_claims enable row level security;
alter table public.investor_offers enable row level security;
alter table public.diligence_items enable row level security;

create policy "investor_sessions_member" on public.investor_sessions for all using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));
create policy "investor_messages_member" on public.investor_messages for all using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));
create policy "investor_claims_member" on public.investor_claims for all using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));
create policy "investor_offers_member" on public.investor_offers for all using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));
create policy "diligence_items_member" on public.diligence_items for all using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));

create trigger investor_sessions_set_updated_at before update on public.investor_sessions for each row execute function public.set_updated_at();
create trigger investor_offers_set_updated_at before update on public.investor_offers for each row execute function public.set_updated_at();
create trigger diligence_items_set_updated_at before update on public.diligence_items for each row execute function public.set_updated_at();
