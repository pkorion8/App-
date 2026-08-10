# Notes for AI coding agents

- **Reference stack is fixed for this slice**: Next.js App Router + TS,
  Supabase (Postgres/Auth), Tailwind, pnpm workspaces. Don't introduce a
  second framework/ORM/auth provider without updating spec §16.1 first.
- **Internal package imports use no file extension** (`from "./foo"`, not
  `"./foo.js"`). `tsc`'s `moduleResolution: Bundler` accepts either, but
  webpack (via Next's `transpilePackages`) only resolves the extensionless
  form against `.ts`/`.tsx` source. Extension-suffixed imports build clean
  under `tsc --noEmit` and then fail `next build` with "Module not found" —
  that mismatch is easy to reintroduce, so keep this consistent.
- **RLS policies must not self-reference their own table** in a `USING`
  clause — Postgres RLS recurses infinitely if they do. Use the
  `public.is_workspace_member()` SECURITY DEFINER helper in
  `supabase/migrations/0001_init.sql` for any new membership check rather
  than inlining `EXISTS (SELECT ... FROM workspace_members ...)` again.
- **`packages/integrations/src/supabase/types.ts` is hand-maintained** —
  there's no live Supabase project to run `supabase gen types` against yet.
  Every table needs `Relationships: []` and the schema object needs
  `Views`/`Functions`/`Enums`/`CompositeTypes` present (even as
  `Record<string, never>`), or `@supabase/supabase-js`'s generic
  constraints silently collapse `.from(...)` to `never` everywhere instead
  of raising a clear error at the type declaration.
- **`@supabase/ssr` and `@supabase/supabase-js` versions are coupled** —
  check the installed `@supabase/ssr`'s `peerDependencies` before bumping
  either independently; a mismatch produces the same silent `never`
  collapse as above, not a clean version error.
- Run `pnpm typecheck && pnpm lint && pnpm build` before considering any
  change to `apps/web` or `packages/*` done. Run
  `tests/integration/rls_smoke_test.sh` after touching anything in
  `supabase/migrations/`.
