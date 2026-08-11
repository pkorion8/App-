-- ---------------------------------------------------------------------
-- Findings previously only stored prose (user_facing_summary as one text
-- blob), so the UI had no choice but to render everything as a wall of
-- text -- competitor lists, indicator values, repo lists all crammed into
-- one paragraph. This column lets live sources also persist the same
-- data in structured form (counts, per-item numbers) so the UI can render
-- real stat tiles / ranked bars / meters instead of parsing prose.
-- Nullable and additive: rows without it (older runs, demo placeholders)
-- just render as plain text, same as before.
-- ---------------------------------------------------------------------
alter table public.findings
  add column if not exists metadata jsonb;
