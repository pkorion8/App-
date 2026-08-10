# Security

## Data isolation

All application tables (`workspaces`, `workspace_members`, `ventures`,
`audit_log`) have Row Level Security enabled and scoped to the requesting
user's workspace membership. There is no service-role key used in
application code — the browser and server both use the anon key, relying
on RLS for isolation. See `supabase/migrations/0001_init.sql` and
`tests/integration/rls_smoke_test.sh`.

## Reporting a vulnerability

This is a pre-launch project (Slice 1 of the build). If you find a
security issue, open an issue in this repository rather than a public
disclosure elsewhere.
