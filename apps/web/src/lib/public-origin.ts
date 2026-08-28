export interface PublicOriginInput {
  configuredSiteUrl?: string | null;
  forwardedHost?: string | null;
  forwardedProto?: string | null;
  requestOrigin?: string | null;
}

function normalizeOrigin(value: string): string | null {
  const trimmed = value.trim().replace(/\/$/, "");
  if (!trimmed) return null;

  try {
    const url = new URL(trimmed);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.origin;
  } catch {
    return null;
  }
}

/**
 * Resolve the public browser-facing origin used in auth redirects.
 *
 * Production prefers the explicitly configured site URL. When that is not
 * available (for example a preview deployment), trust only the first
 * reverse-proxy host and an http/https forwarded protocol. Finally fall back
 * to the origin already present on the request, then localhost for local dev.
 */
export function resolvePublicOrigin({
  configuredSiteUrl,
  forwardedHost,
  forwardedProto,
  requestOrigin,
}: PublicOriginInput): string {
  const configured = configuredSiteUrl ? normalizeOrigin(configuredSiteUrl) : null;
  if (configured) return configured;

  const host = forwardedHost?.split(",")[0]?.trim();
  const protoCandidate = forwardedProto?.split(",")[0]?.trim().toLowerCase();
  const proto = protoCandidate === "http" || protoCandidate === "https" ? protoCandidate : "https";
  if (host && !/[\s\\/]/.test(host)) {
    const forwarded = normalizeOrigin(`${proto}://${host}`);
    if (forwarded) return forwarded;
  }

  const request = requestOrigin ? normalizeOrigin(requestOrigin) : null;
  return request ?? "http://localhost:3000";
}
