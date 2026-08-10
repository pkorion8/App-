-- ---------------------------------------------------------------------
-- Simulation day-by-day history (for charting cash/users/revenue trends
-- on the Simulate page -- previously only the current snapshot and a
-- sparse narrative event log existed, neither of which is a real
-- per-day series).
-- ---------------------------------------------------------------------
alter table public.simulation_runs
  add column history jsonb not null default '[]'::jsonb;
