import type { ClaimType } from "@venture-sandbox/domain";
import type { TranscriptSegment } from "../sources/youtube-transcript-connector";

export interface ExtractedClaim {
  claimType: ClaimType;
  claimText: string;
  videoTimestampSeconds: number | null;
}

/**
 * Keyword/regex-pattern extraction -- this is the "extraction_method:
 * heuristic" tier, not the "llm" tier (spec's evidence model treats these
 * differently, and so does this codebase's confidence labeling).
 *
 * This WILL miss claims phrased unusually and WILL occasionally mismatch
 * (e.g. a timestamp-looking number that isn't actually a cost). It's a
 * zero-cost first pass, not a substitute for LLM extraction -- swap in an
 * LLM-based extractor here once an API key is available, and keep this as
 * the free fallback rather than deleting it.
 */
const PATTERNS: Array<{ type: ClaimType; regex: RegExp }> = [
  { type: "cost", regex: /\b(cost me|spent|paid|it cost)\s*(about|around|roughly)?\s*\$[\d,]+(\.\d+)?[kK]?\b/gi },
  { type: "cost", regex: /\$[\d,]+(\.\d+)?[kK]?\s*(to build|to make|total cost|in costs)\b/gi },
  { type: "revenue", regex: /\b(MRR|ARR|monthly revenue|revenue|earning|making|makes)\s*(is|of|about|around)?\s*\$[\d,]+(\.\d+)?[kK]?\b/gi },
  { type: "revenue", regex: /\$[\d,]+(\.\d+)?[kK]?\s*(a month|\/month|per month|MRR|in revenue)\b/gi },
  { type: "users", regex: /\b[\d,]+\+?\s*(users|downloads|signups|sign-ups|customers|subscribers|installs)\b/gi },
  { type: "timeline", regex: /\b(built|shipped|launched|made)\s*(this|it)?\s*in\s*(about|around|roughly)?\s*[\d]+\s*(hours?|days?|weeks?|months?)\b/gi },
  { type: "timeline", regex: /\btook\s*(me|us)?\s*(about|around|roughly)?\s*[\d]+\s*(hours?|days?|weeks?|months?)\s*(to build|to make|to ship|to launch)?\b/gi },
  {
    type: "tooling",
    regex: /\b(Lovable|Bubble|Framer|Cursor|Replit|Supabase|Vercel|Firebase|Next\.js|Bolt\.new|Claude|GPT-?4|OpenAI|v0\.dev|Webflow|Softr|Glide)\b/g,
  },
];

/** Merges caption segments into a single string with an offset->seconds map, so regex matches can be traced back to a rough video timestamp. */
function buildIndexedTranscript(segments: TranscriptSegment[]): {
  text: string;
  offsetToSeconds: Array<{ offset: number; seconds: number }>;
} {
  let text = "";
  const offsetToSeconds: Array<{ offset: number; seconds: number }> = [];
  for (const seg of segments) {
    offsetToSeconds.push({ offset: text.length, seconds: seg.startSeconds });
    text += seg.text + " ";
  }
  return { text, offsetToSeconds };
}

function nearestTimestamp(
  offset: number,
  offsetToSeconds: Array<{ offset: number; seconds: number }>,
): number | null {
  let result: number | null = null;
  for (const entry of offsetToSeconds) {
    if (entry.offset > offset) break;
    result = entry.seconds;
  }
  return result;
}

const SENTENCE_BOUNDARY = /[.!?]\s/;

/**
 * The sentence containing the match, not a fixed character window --
 * auto-generated captions vary wildly in per-segment length, so a fixed
 * window either truncates mid-word (short segments) or drags in unrelated
 * neighboring sentences (long segments, e.g. when segments already contain
 * full sentences). Falls back to a capped window only if no sentence
 * boundary is found within a reasonable distance (e.g. transcripts with no
 * punctuation, which auto-captions sometimes produce).
 */
function surroundingSentence(text: string, matchIndex: number, matchLength: number): string {
  const maxRadius = 160;
  const searchStart = Math.max(0, matchIndex - maxRadius);
  const searchEnd = Math.min(text.length, matchIndex + matchLength + maxRadius);

  const before = text.slice(searchStart, matchIndex);
  const lastBoundary = findLastBoundaryIndex(before);
  const start = lastBoundary === -1 ? searchStart : searchStart + lastBoundary + 2;

  const after = text.slice(matchIndex + matchLength, searchEnd);
  const nextBoundaryMatch = SENTENCE_BOUNDARY.exec(after);
  const end =
    nextBoundaryMatch && nextBoundaryMatch.index !== undefined
      ? matchIndex + matchLength + nextBoundaryMatch.index + 1
      : searchEnd;

  return text.slice(start, end).trim();
}

function findLastBoundaryIndex(text: string): number {
  let lastIndex = -1;
  const re = new RegExp(SENTENCE_BOUNDARY, "g");
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    lastIndex = m.index;
  }
  return lastIndex;
}

export function extractHeuristicClaims(segments: TranscriptSegment[]): ExtractedClaim[] {
  const { text, offsetToSeconds } = buildIndexedTranscript(segments);
  const claims: ExtractedClaim[] = [];
  const seen = new Set<string>();

  for (const { type, regex } of PATTERNS) {
    // Each pattern object's regex is shared across calls (module-level
    // array); reset lastIndex since these are stateful global regexes.
    regex.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(text)) !== null) {
      const claimText = surroundingSentence(text, match.index, match[0].length);
      const dedupeKey = `${type}:${claimText}`;
      if (seen.has(dedupeKey)) continue;
      seen.add(dedupeKey);

      claims.push({
        claimType: type,
        claimText,
        videoTimestampSeconds: nearestTimestamp(match.index, offsetToSeconds),
      });
    }
  }

  return claims;
}
