import { describe, expect, it } from "vitest";
import { generateBuildPackage } from "./generator";

describe("generateBuildPackage", () => {
  it("detects AI + image + payments dependencies without inventing prices", () => {
    const pkg = generateBuildPackage({
      ventureName: "Design Try-On",
      ideaText: "An AI app that generates image designs and lets users buy the result as a subscription.",
    });

    expect(pkg.recommendedStack.notableApis).toEqual(
      expect.arrayContaining([
        expect.stringContaining("LLM API"),
        expect.stringContaining("image-generation"),
        expect.stringContaining("Stripe"),
      ]),
    );
    expect(pkg.costEstimate.items.some((i) => i.name === "LLM API usage")).toBe(true);
    expect(pkg.costEstimate.items.some((i) => i.name === "Image generation API")).toBe(true);
    expect(pkg.costEstimate.totalMonthly).toBeNull();
    expect(pkg.costEstimate.items.every((i) => i.monthlyCost === null)).toBe(true);
  });

  it("keeps provider pricing unpriced when no live pricing source is connected", () => {
    const pkg = generateBuildPackage({
      ventureName: "Local Directory",
      ideaText: "A simple list of local businesses and their opening hours.",
    });

    expect(pkg.recommendedStack.notableApis).toEqual([]);
    expect(pkg.costEstimate.totalMonthly).toBeNull();
    expect(pkg.costEstimate.items.every((i) => i.monthlyCost === null)).toBe(true);
  });

  it("detects realtime needs for a chat-shaped idea", () => {
    const pkg = generateBuildPackage({
      ventureName: "Team Chat",
      ideaText: "Real-time group chat for small teams.",
    });
    expect(pkg.recommendedStack.notableApis).toEqual(
      expect.arrayContaining([expect.stringContaining("Realtime")]),
    );
  });

  it("always presents exactly 3 builder-neutral options, in the same order", () => {
    const pkg = generateBuildPackage({ ventureName: "X", ideaText: "Anything at all." });
    expect(pkg.recommendedStack.builderOptions.map((o) => o.name)).toEqual([
      "AI builder (Lovable, Bolt.new, v0, Replit)",
      "Write the code yourself (Next.js + Supabase)",
      "Hire a developer/agency",
    ]);
  });

  it("labels pricing as unconnected instead of presenting stale vendor numbers", () => {
    const pkg = generateBuildPackage({
      ventureName: "Everything App",
      ideaText: "AI chat assistant with image generation and paid subscriptions.",
    });

    expect(pkg.costEstimate.totalMonthly).toBeNull();
    expect(pkg.costEstimate.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ monthlyCost: null, note: expect.stringMatching(/not (connected|live-fetched)/i) }),
      ]),
    );
    expect(pkg.recommendedStack.builderOptions.map((o) => o.costNote).join(" ")).not.toMatch(/\$\d+/);
  });
});
