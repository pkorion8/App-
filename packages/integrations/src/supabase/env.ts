export interface SupabaseEnv {
  url: string;
  anonKey: string;
}

export interface SupabaseEnvInput {
  url: string | undefined;
  anonKey: string | undefined;
}

function normalizeSupabaseUrl(value: string | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;

  try {
    const url = new URL(trimmed);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    return url.origin;
  } catch {
    return null;
  }
}

function normalizeAnonKey(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function isSupabaseConfigured(env: SupabaseEnvInput): boolean {
  return Boolean(normalizeSupabaseUrl(env.url) && normalizeAnonKey(env.anonKey));
}

export function resolveSupabaseEnv(env: SupabaseEnvInput): SupabaseEnv {
  const url = normalizeSupabaseUrl(env.url);
  const anonKey = normalizeAnonKey(env.anonKey);

  if (!url || !anonKey) {
    throw new Error(
      "Supabase is not configured correctly. Set NEXT_PUBLIC_SUPABASE_URL to a valid http(s) origin and " +
        "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY to a non-empty project key (see .env.example) before signing in.",
    );
  }

  return { url, anonKey };
}
