-- ---------------------------------------------------------------------
-- Pricing model: a founder decision (Shape's job, not Research's), and
-- until now completely unused by the Simulator even though it directly
-- changes real-world revenue mechanics -- a one-time-purchase product
-- and a subscription product with the same user count earn very
-- different money, and the engine treated every venture as a
-- subscription. venture_shapes.pricing_model is founder-set (nullable --
-- "not decided yet" is honest and common pre-Shape); simulation_runs.
-- pricing_model is a snapshot of that choice at the moment a run starts
-- (not nullable -- defaults to 'subscription', the engine's original
-- and still-default behavior, so existing rows keep working unchanged).
-- ---------------------------------------------------------------------
alter table public.venture_shapes
  add column if not exists pricing_model text
    check (pricing_model in ('subscription', 'one_time', 'commission', 'ad_supported'));

alter table public.simulation_runs
  add column if not exists pricing_model text not null default 'subscription'
    check (pricing_model in ('subscription', 'one_time', 'commission', 'ad_supported'));
