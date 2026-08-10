export interface ParsedChannelInput {
  channelId: string;
  channelHandle: string | null;
  /** True if channelId is a real resolved ID (UC...); false if it's a best-effort placeholder (a handle or raw input) that still needs resolving via the YouTube Data API. */
  isResolved: boolean;
}

/**
 * Best-effort parsing of a pasted channel URL/handle/ID -- no network
 * call, no API key needed. A raw channel ID (starts with "UC", 24 chars)
 * is usable immediately by the discovery module. A handle or URL is
 * stored as-is (channelId = the handle) so it's visible in the UI, but
 * won't resolve to real uploads until a YouTube API key is connected and
 * a handle-resolution pass runs -- that's a known, flagged gap, not
 * silent data loss.
 */
export function parseChannelInput(raw: string): ParsedChannelInput {
  const trimmed = raw.trim();

  const channelUrlMatch = trimmed.match(/youtube\.com\/channel\/(UC[\w-]{22})/);
  if (channelUrlMatch) {
    return { channelId: channelUrlMatch[1]!, channelHandle: null, isResolved: true };
  }

  const bareIdMatch = trimmed.match(/^(UC[\w-]{22})$/);
  if (bareIdMatch) {
    return { channelId: bareIdMatch[1]!, channelHandle: null, isResolved: true };
  }

  const handleUrlMatch = trimmed.match(/youtube\.com\/(@[\w.-]+)/);
  if (handleUrlMatch) {
    const handle = handleUrlMatch[1]!;
    return { channelId: handle, channelHandle: handle, isResolved: false };
  }

  if (trimmed.startsWith("@")) {
    return { channelId: trimmed, channelHandle: trimmed, isResolved: false };
  }

  // Unrecognized format -- store as-is under both fields so it's visible
  // and editable later rather than rejected outright.
  return { channelId: trimmed, channelHandle: trimmed, isResolved: false };
}
