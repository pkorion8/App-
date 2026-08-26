// Kept deliberately light: this is imported by the interactive Research
// page (apps/web/.../research/actions.ts), which must never pull in
// playwright-core or the YouTube modules transitively -- that dragged a
// Node-only browser-automation dependency into an unrelated user-facing
// route and broke the Next.js build. Cron-only modules are reached via
// their own subpath exports instead (see package.json "exports"):
//   @venture-sandbox/research/youtube-discovery
//   @venture-sandbox/research/youtube-transcript
//   @venture-sandbox/research/heuristic-claims
import { classifyRatingVolume } from "./live-findings";

export * from "./demo-findings";
export * from "./live-findings";
export * from "./sources/itunes-search";
export * from "./parse-channel-input";
export * from "./geography";
export * from "./finding-metadata";
export * from "./search-keywords";
export * from "./source-registry";

/**
 * Backward-compatible mapping used by the simulator. The research layer now
 * describes App Store rating volume as High/Medium/Low rather than implying
 * true market traction. The simulator still expects Strong/Moderate/Weak as
 * its internal pressure bands, so convert explicitly here without changing
 * what the source evidence claims.
 */
export function classifyTraction(ratingCounts: number[]): "Strong" | "Moderate" | "Weak" {
  const band = classifyRatingVolume(ratingCounts);
  if (band === "High") return "Strong";
  if (band === "Medium") return "Moderate";
  return "Weak";
}
