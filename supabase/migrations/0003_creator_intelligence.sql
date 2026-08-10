-- Creator Intelligence layer (YouTube channel monitoring -> extracted claims).
--
-- Unlike ventures/research_missions/findings, these tables are NOT scoped to
-- a single workspace. This is shared platform research infrastructure: one
-- accumulating evidence base every user's research draws from, matching the
-- addendum's "our own accumulating database becomes our moat" framing.
--
-- Write access is intentionally NOT granted to regular authenticated users
-- via RLS. The daily cron job writes here using the Supabase service_role
-- key (bypasses RLS entirely), which is why it's the one place in this
-- codebase a service-role key is used at all -- see AGENTS.md.

create table public.youtube_channels (
  id uuid primary key default gen_random_uuid(),
  channel_id text not null unique, -- YouTube's canonical channel ID (UC...)
  channel_handle text,
  channel_name text,
  added_by uuid references auth.users (id) on delete set null,
  is_active boolean not null default true,
  last_checked_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.youtube_channels enable row level security;

-- Shared registry: any signed-in user can see it and suggest a channel.
-- Deactivating a channel (is_active = false) is a moderation action, not
-- exposed here yet -- do that via the Supabase dashboard for now.
create policy "youtube_channels_select_authenticated"
  on public.youtube_channels for select
  to authenticated
  using (true);

create policy "youtube_channels_insert_authenticated"
  on public.youtube_channels for insert
  to authenticated
  with check (added_by = auth.uid());

create index youtube_channels_active_idx on public.youtube_channels (is_active);

-- ---------------------------------------------------------------------
-- creator_claims
-- ---------------------------------------------------------------------
create table public.creator_claims (
  id uuid primary key default gen_random_uuid(),
  channel_id uuid not null references public.youtube_channels (id) on delete cascade,
  video_id text not null,
  video_title text not null,
  video_url text not null,
  published_at timestamptz,
  claim_type text not null
    check (claim_type in ('cost', 'revenue', 'users', 'tooling', 'timeline', 'problem', 'marketing', 'other')),
  claim_text text not null,
  video_timestamp_seconds integer,
  -- How the claim was pulled out of the transcript. 'heuristic' (keyword/
  -- pattern matching) is materially less trustworthy than 'llm' (a model
  -- actually read the claim in context) -- surface this, don't hide it.
  extraction_method text not null default 'heuristic'
    check (extraction_method in ('heuristic', 'llm', 'manual')),
  -- Every claim here is a creator's self-report, not an independently
  -- verified fact, regardless of extraction_method. This column exists so
  -- the UI never has to guess -- it's always 'unverified' today; a future
  -- cross-check step (e.g. does App Store data corroborate this) is what
  -- would ever change it.
  confidence text not null default 'unverified'
    check (confidence in ('unverified', 'corroborated')),
  created_at timestamptz not null default now()
);

alter table public.creator_claims enable row level security;

create policy "creator_claims_select_authenticated"
  on public.creator_claims for select
  to authenticated
  using (true);

create index creator_claims_channel_id_idx on public.creator_claims (channel_id);
create index creator_claims_video_id_idx on public.creator_claims (video_id);
create index creator_claims_claim_type_idx on public.creator_claims (claim_type);
create unique index creator_claims_dedupe_idx
  on public.creator_claims (video_id, claim_type, claim_text);
