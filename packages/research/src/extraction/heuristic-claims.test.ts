import { describe, expect, it } from "vitest";
import { extractHeuristicClaims } from "./heuristic-claims";
import type { TranscriptSegment } from "../sources/youtube-transcript-connector";

function segments(...texts: string[]): TranscriptSegment[] {
  return texts.map((text, i) => ({ text, startSeconds: i * 5 }));
}

describe("extractHeuristicClaims", () => {
  it("extracts a cost claim and a separate revenue claim from different sentences", () => {
    const claims = extractHeuristicClaims(
      segments("Building this cost me about $4,000 total.", "We're now making $2,000 a month in revenue."),
    );

    const cost = claims.find((c) => c.claimType === "cost");
    const revenue = claims.find((c) => c.claimType === "revenue");
    expect(cost).toBeDefined();
    expect(cost?.claimText).toContain("$4,000");
    expect(revenue).toBeDefined();
    expect(revenue?.claimText).toContain("$2,000");
  });

  it("keeps the claim text scoped to its own sentence, not neighboring ones", () => {
    const claims = extractHeuristicClaims(
      segments(
        "Before I get into numbers, let me say the idea started as a weekend project. " +
          "It cost me around $500 to build. " +
          "Anyway, completely unrelated, I also like coffee.",
      ),
    );
    const cost = claims.find((c) => c.claimType === "cost");
    expect(cost?.claimText).toContain("$500");
    expect(cost?.claimText).not.toContain("weekend project");
    expect(cost?.claimText).not.toContain("coffee");
  });

  it("extracts a users claim and a tooling mention", () => {
    const claims = extractHeuristicClaims(
      segments("We hit 1,200 users in the first month, built with Supabase and Next.js."),
    );
    expect(claims.some((c) => c.claimType === "users" && c.claimText.includes("1,200 users"))).toBe(true);
    expect(claims.some((c) => c.claimType === "tooling" && c.claimText.includes("Supabase"))).toBe(true);
  });

  it("attaches the nearest preceding segment's timestamp to a match", () => {
    const claims = extractHeuristicClaims([
      { text: "Some intro chat. ", startSeconds: 0 },
      { text: "It cost me about $1,000 to launch. ", startSeconds: 42 },
    ]);
    const cost = claims.find((c) => c.claimType === "cost");
    expect(cost?.videoTimestampSeconds).toBe(42);
  });

  it("does not emit duplicate claims for the same matched text", () => {
    const claims = extractHeuristicClaims(segments("It cost me about $900 to build. It cost me about $900 to build."));
    const costClaims = claims.filter((c) => c.claimType === "cost");
    expect(costClaims).toHaveLength(1);
  });

  it("returns nothing for a transcript with no matching patterns", () => {
    const claims = extractHeuristicClaims(segments("Thanks for watching, see you next time."));
    expect(claims).toEqual([]);
  });
});
