export interface SupabaseEnv {
  url: string;
  anonKey: string;
}

export interface SupabaseEnvInput {
  url: string | undefined;
  anonKey: string | undefined;
}

export function isSupabaseConfigured(env: SupabaseEnvInput): boolean {
  return Boolean(env.url && env.anonKey);
}

export function resolveSupabaseEnv(env: SupabaseEnvInput): SupabaseEnv {
  if (!isSupabaseConfigured(env)) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and " +
        "NEXT_PUBLIC_SUPABASE_ANON_KEY (see .env.example) to a Supabase " +
        "project's values before signing in.",
    );
  }
  return { url: env.url as string, anonKey: env.anonKey as string };
}
