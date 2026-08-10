import type { Browser, LaunchOptions } from "playwright-core";

/**
 * Browser-assisted transcript connector ("Route D" in the addendum's
 * discussion of this feature) -- EXPERIMENTAL, best-effort, not a
 * dependency the rest of the product relies on.
 *
 * IMPORTANT — read before touching this file:
 *
 * 1. This automates a real browser to reach content YouTube shows any
 *    signed-out human viewer (captions/transcripts are a standard
 *    accessibility feature). It does NOT bypass a paywall or access
 *    private data. It DOES count as "automated access" under YouTube's
 *    Terms either way — that's a real, accepted tradeoff for this
 *    project, not an oversight. See the addendum's Creator Intelligence
 *    section for the full reasoning. Treat every result from this file as
 *    "worked today" — it can silently stop working whenever YouTube
 *    changes its page structure or bot detection, with no warning and no
 *    one to escalate to. Every caller MUST handle a null/empty result as
 *    a normal, expected outcome, not an error to alert on.
 *
 * 2. UNTESTED LIVE as of writing: the sandbox this was built in blocks
 *    outbound browser traffic to arbitrary sites at the network level
 *    (confirmed via ERR_CONNECTION_RESET, unrelated to YouTube), so the
 *    click-path/selector logic below could not be verified end-to-end
 *    before shipping. Verify against a real video before trusting it.
 *
 * 3. Design choice: rather than clicking YouTube's "Show transcript" UI
 *    (buttons/menus that change often), this reads `ytInitialPlayerResponse`
 *    -- a JSON blob YouTube already embeds in the page on load containing
 *    direct transcript URLs -- then fetches that URL from *within the same
 *    browser context* (so it carries real cookies/session, unlike a bare
 *    server-side HTTP request, which is what got blocked in earlier
 *    testing). This is less fragile than DOM-clicking but still depends on
 *    YouTube's internal JSON shape, which they don't document or promise
 *    to keep stable.
 */

export interface TranscriptSegment {
  text: string;
  startSeconds: number;
}

export interface BrowserConnectorConfig {
  executablePath: string;
  launchArgs?: string[];
  proxyServer?: string;
}

const NAV_TIMEOUT_MS = 20000;

export async function fetchTranscriptViaBrowser(
  videoId: string,
  config: BrowserConnectorConfig,
): Promise<TranscriptSegment[] | null> {
  let browser: Browser | undefined;
  try {
    const { chromium } = await import("playwright-core");
    browser = await chromium.launch({
      executablePath: config.executablePath,
      args: config.launchArgs ?? ["--no-sandbox", "--disable-setuid-sandbox"],
      proxy: config.proxyServer ? { server: config.proxyServer } : undefined,
    });

    const context = await browser.newContext({
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
        "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      viewport: { width: 1280, height: 800 },
    });
    const page = await context.newPage();

    await page.goto(`https://www.youtube.com/watch?v=${videoId}`, {
      waitUntil: "domcontentloaded",
      timeout: NAV_TIMEOUT_MS,
    });

    const captionUrl: string | null = await page.evaluate(() => {
      // @ts-expect-error -- ytInitialPlayerResponse is a YouTube page global, not a typed API.
      const tracks = window.ytInitialPlayerResponse?.captions
        ?.playerCaptionsTracklistRenderer?.captionTracks as
        | Array<{ baseUrl?: string; languageCode?: string }>
        | undefined;
      if (!tracks || tracks.length === 0) return null;
      const english = tracks.find((t) => t.languageCode?.startsWith("en"));
      return (english ?? tracks[0])!.baseUrl ?? null;
    });

    if (!captionUrl) {
      return null;
    }

    // Fetch from within the browser context, not a separate server-side
    // request -- this carries the session/cookies the navigation just
    // established, which a bare fetch from the calling process would not.
    const transcriptXml: string = await page.evaluate(async (url) => {
      const res = await fetch(url);
      return res.text();
    }, captionUrl);

    return parseTimedTextXml(transcriptXml);
  } catch {
    // Any failure here (nav timeout, no captions, YouTube UI change,
    // detection block) degrades to "no transcript available" -- never
    // throws up to the caller.
    return null;
  } finally {
    await browser?.close().catch(() => {});
  }
}

function parseTimedTextXml(xml: string): TranscriptSegment[] {
  const segments: TranscriptSegment[] = [];
  const re = /<text start="([\d.]+)"[^>]*>([\s\S]*?)<\/text>/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(xml)) !== null) {
    const startSeconds = parseFloat(match[1]!);
    const text = decodeHtmlEntities(match[2]!.trim());
    if (text) segments.push({ text, startSeconds });
  }
  return segments;
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n/g, " ");
}
