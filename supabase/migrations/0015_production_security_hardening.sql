-- Production security hardening for Supabase projects created after the
-- Data API auto-exposure default changed in 2026.
--
-- 1. Move the recursive-RLS helper out of the exposed public schema.
-- 2. Restrict every application policy to authenticated users.
-- 3. Remove direct API execution of trigger/security-definer functions.
-- 4. Make Data API grants explicit instead of relying on project defaults.

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated, service_role;

create or replace function private.is_workspace_member(target_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.workspace_members m
    where m.workspace_id = target_workspace_id
      and m.user_id = (select auth.uid())
  );
$$;

revoke all on function private.is_workspace_member(uuid) from public, anon;
grant execute on function private.is_workspace_member(uuid) to authenticated, service_role;

-- Rewrite every existing application policy in place. The catalog expressions
-- are produced by PostgreSQL itself; only the known helper function reference
-- is replaced before ALTER POLICY executes them.
do $$
declare
  policy_row record;
  statement text;
  updated_using text;
  updated_check text;
begin
  for policy_row in
    select schemaname, tablename, policyname, qual, with_check
    from pg_policies
    where schemaname = 'public'
  loop
    statement := format(
      'alter policy %I on %I.%I to authenticated',
      policy_row.policyname,
      policy_row.schemaname,
      policy_row.tablename
    );

    if policy_row.qual is not null then
      updated_using := regexp_replace(
        policy_row.qual,
        '(public[.])?is_workspace_member[(]',
        'private.is_workspace_member(',
        'g'
      );
      statement := statement || format(' using (%s)', updated_using);
    end if;

    if policy_row.with_check is not null then
      updated_check := regexp_replace(
        policy_row.with_check,
        '(public[.])?is_workspace_member[(]',
        'private.is_workspace_member(',
        'g'
      );
      statement := statement || format(' with check (%s)', updated_check);
    end if;

    execute statement;
  end loop;
end
$$;

-- Avoid per-row auth function evaluation in the two policies that call
-- auth.uid() directly rather than the membership helper.
alter policy "audit_log_insert_self"
  on public.audit_log
  with check (actor_id = (select auth.uid()));

alter policy "youtube_channels_insert_authenticated"
  on public.youtube_channels
  with check (added_by = (select auth.uid()));

-- The replacement helper is now referenced by every policy.
drop function public.is_workspace_member(uuid);

-- Trigger functions do not need to be callable through the Data API.
alter function public.handle_new_user() set search_path = '';
alter function public.set_updated_at() set search_path = '';

revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.set_updated_at() from public, anon, authenticated;
grant execute on function public.handle_new_user() to supabase_auth_admin;

-- Explicit grants are required for projects where automatic Data API table
-- exposure is disabled. RLS remains the authorization boundary.
revoke all privileges on all tables in schema public from anon;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant all privileges on all tables in schema public to service_role;

grant usage, select on all sequences in schema public to authenticated, service_role;

alter default privileges in schema public revoke all on tables from anon;
alter default privileges in schema public grant select, insert, update, delete on tables to authenticated;
alter default privileges in schema public grant all on tables to service_role;
alter default privileges in schema public grant usage, select on sequences to authenticated, service_role;
alter default privileges in schema public revoke execute on functions from public;

