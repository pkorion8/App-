-- ---------------------------------------------------------------------
-- Simulate previously ignored a venture's own Research findings entirely
-- (only a starting budget went in). This column stores what a run's
-- starting conditions were calibrated against -- real competitor traction
-- from the venture's most recent Research run, or an honest "no research
-- yet" marker -- so the simulation and the record of *why* it started the
-- way it did travel together. Nullable: existing rows fall back to the
-- app's DEFAULT_MARKET_CONTEXT at read time (see row-mapping.ts).
-- ---------------------------------------------------------------------
alter table public.simulation_runs
  add column if not exists market_context jsonb;
