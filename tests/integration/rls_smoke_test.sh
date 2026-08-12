#!/usr/bin/env bash
# Applies supabase/migrations against a plain Postgres instance (stubbing
# the auth.users table and auth.uid() that a real Supabase project
# provides) and asserts workspace-scoped RLS actually isolates users.
#
# This exists because the first version of 0001_init.sql had a
# self-referential workspace_members SELECT policy that caused infinite
# recursion under RLS — a bug `tsc`/`next build` cannot catch since it's
# a Postgres-side policy-evaluation error, not a type error. Run locally
# with: PGHOST=... tests/integration/rls_smoke_test.sh
set -euo pipefail

DB_NAME="${RLS_TEST_DB:-vs_rls_smoke}"
PSQL="psql -v ON_ERROR_STOP=1"
MIGRATIONS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../supabase/migrations" && pwd)"

echo "==> Stubbing Supabase database roles"
$PSQL <<'SQL'
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin;
  end if;
end
$$;
SQL

echo "==> Recreating $DB_NAME"
$PSQL -c "DROP DATABASE IF EXISTS $DB_NAME;"
$PSQL -c "CREATE DATABASE $DB_NAME;"

echo "==> Stubbing auth schema (auth.users, auth.uid())"
$PSQL -d "$DB_NAME" <<'SQL'
create schema auth;
create table auth.users (
  id uuid primary key default gen_random_uuid(),
  email text
);
create function auth.uid() returns uuid
language sql stable as $$
  select nullif(current_setting('request.jwt.uid', true), '')::uuid
$$;
SQL

echo "==> Applying migrations"
for f in "$MIGRATIONS_DIR"/*.sql; do
  echo "  - $(basename "$f")"
  $PSQL -d "$DB_NAME" -f "$f"
done

echo "==> Seeding two users + low-privilege role"
$PSQL -d "$DB_NAME" <<'SQL'
insert into auth.users (email) values ('owner@example.com');
insert into auth.users (email) values ('intruder@example.com');

drop role if exists app_user;
create role app_user nologin in role authenticated;
grant usage on schema public to app_user;
grant select, insert, update on public.ventures to app_user;
grant select, insert on public.audit_log to app_user;
grant select on public.workspaces to app_user;
grant select on public.workspace_members to app_user;
grant select, insert, update on public.venture_shapes to app_user;
grant select, update on public.billing_accounts to app_user;
SQL

OWNER_ID=$($PSQL -d "$DB_NAME" -tAc "select id from auth.users where email='owner@example.com';")
INTRUDER_ID=$($PSQL -d "$DB_NAME" -tAc "select id from auth.users where email='intruder@example.com';")
WORKSPACE_ID=$($PSQL -d "$DB_NAME" -tAc "select id from workspaces where owner_id='$OWNER_ID';")

echo "==> Asserting the owner can list workspace_members (exercises the self-referential policy directly)"
MEMBER_ROWS=$($PSQL -d "$DB_NAME" -tAc "
set role app_user;
set request.jwt.uid = '$OWNER_ID';
select count(*) from public.workspace_members;
" | tail -n1 | tr -d '[:space:]')
if [ "$MEMBER_ROWS" -ne 1 ]; then
  echo "FAIL: owner should see exactly 1 workspace_members row, saw $MEMBER_ROWS"
  exit 1
fi

echo "==> Asserting the workspace owner can create a venture"
$PSQL -d "$DB_NAME" -v ON_ERROR_STOP=1 <<SQL
set role app_user;
set request.jwt.uid = '$OWNER_ID';
insert into public.ventures (workspace_id, name, raw_idea_text)
values ('$WORKSPACE_ID', 'Smoke test venture', 'Exists only to prove RLS allows the owner through.');
reset role;
SQL

VISIBLE_TO_OWNER=$($PSQL -d "$DB_NAME" -tAc "
set role app_user;
set request.jwt.uid = '$OWNER_ID';
select count(*) from public.ventures;
" | tail -n1 | tr -d '[:space:]')
if [ "$VISIBLE_TO_OWNER" -ne 1 ]; then
  echo "FAIL: owner should see exactly 1 venture, saw $VISIBLE_TO_OWNER"
  exit 1
fi

echo "==> Asserting a different user cannot see or insert into that workspace"
set +e
INSERT_OUTPUT=$($PSQL -d "$DB_NAME" 2>&1 <<SQL
set role app_user;
set request.jwt.uid = '$INTRUDER_ID';
insert into public.ventures (workspace_id, name, raw_idea_text)
values ('$WORKSPACE_ID', 'Should be rejected', 'RLS must reject this insert.');
reset role;
SQL
)
INSERT_STATUS=$?
set -e

if [ $INSERT_STATUS -eq 0 ]; then
  echo "FAIL: intruder insert should have been rejected by RLS, but it succeeded"
  exit 1
fi
if ! echo "$INSERT_OUTPUT" | grep -q "row-level security policy"; then
  echo "FAIL: expected an RLS violation error, got:"
  echo "$INSERT_OUTPUT"
  exit 1
fi

VISIBLE_TO_INTRUDER=$($PSQL -d "$DB_NAME" -tAc "
set role app_user;
set request.jwt.uid = '$INTRUDER_ID';
select count(*) from public.ventures;
" | tail -n1 | tr -d '[:space:]')
if [ "$VISIBLE_TO_INTRUDER" -ne 0 ]; then
  echo "FAIL: intruder should see 0 ventures, saw $VISIBLE_TO_INTRUDER"
  exit 1
fi

VENTURE_ID=$($PSQL -d "$DB_NAME" -tAc "select id from ventures where name='Smoke test venture';")

echo "==> Asserting the owner can create and read a venture_shapes row"
$PSQL -d "$DB_NAME" -v ON_ERROR_STOP=1 <<SQL
set role app_user;
set request.jwt.uid = '$OWNER_ID';
insert into public.venture_shapes (venture_id, workspace_id, problem_statement)
values ('$VENTURE_ID', '$WORKSPACE_ID', 'Smoke test problem statement.');
reset role;
SQL

SHAPES_VISIBLE_TO_OWNER=$($PSQL -d "$DB_NAME" -tAc "
set role app_user;
set request.jwt.uid = '$OWNER_ID';
select count(*) from public.venture_shapes;
" | tail -n1 | tr -d '[:space:]')
if [ "$SHAPES_VISIBLE_TO_OWNER" -ne 1 ]; then
  echo "FAIL: owner should see exactly 1 venture_shapes row, saw $SHAPES_VISIBLE_TO_OWNER"
  exit 1
fi

echo "==> Asserting a different user cannot see that venture_shapes row"
SHAPES_VISIBLE_TO_INTRUDER=$($PSQL -d "$DB_NAME" -tAc "
set role app_user;
set request.jwt.uid = '$INTRUDER_ID';
select count(*) from public.venture_shapes;
" | tail -n1 | tr -d '[:space:]')
if [ "$SHAPES_VISIBLE_TO_INTRUDER" -ne 0 ]; then
  echo "FAIL: intruder should see 0 venture_shapes rows, saw $SHAPES_VISIBLE_TO_INTRUDER"
  exit 1
fi

echo "==> Asserting handle_new_user auto-created a free billing_accounts row the owner can see"
OWNER_PLAN=$($PSQL -d "$DB_NAME" -tAc "
set role app_user;
set request.jwt.uid = '$OWNER_ID';
select plan from public.billing_accounts where workspace_id = '$WORKSPACE_ID';
" | tail -n1 | tr -d '[:space:]')
if [ "$OWNER_PLAN" != "free" ]; then
  echo "FAIL: expected the auto-created billing_accounts row to be plan='free', got '$OWNER_PLAN'"
  exit 1
fi

echo "==> Asserting a workspace member (even the owner) CANNOT self-upgrade billing_accounts -- only the service-role webhook may write here"
set +e
SELF_UPGRADE_OUTPUT=$($PSQL -d "$DB_NAME" 2>&1 <<SQL
set role app_user;
set request.jwt.uid = '$OWNER_ID';
update public.billing_accounts set plan = 'pro', status = 'active' where workspace_id = '$WORKSPACE_ID';
reset role;
SQL
)
set -e
# With select+update GRANTed but no UPDATE policy, Postgres RLS silently
# matches zero rows rather than raising -- so the real assertion is that
# the row is still 'free' after this, not that the statement errored.
PLAN_AFTER_ATTEMPT=$($PSQL -d "$DB_NAME" -tAc "
set role app_user;
set request.jwt.uid = '$OWNER_ID';
select plan from public.billing_accounts where workspace_id = '$WORKSPACE_ID';
" | tail -n1 | tr -d '[:space:]')
if [ "$PLAN_AFTER_ATTEMPT" != "free" ]; then
  echo "FAIL: a workspace member was able to self-upgrade billing_accounts to '$PLAN_AFTER_ATTEMPT' -- this is a revenue-bypass vulnerability"
  exit 1
fi

echo "==> Cleaning up"
$PSQL -c "DROP DATABASE IF EXISTS $DB_NAME;"
$PSQL -c "DROP ROLE IF EXISTS app_user;"

echo "PASS: RLS smoke test"
