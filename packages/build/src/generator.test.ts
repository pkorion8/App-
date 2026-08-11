import { describe, expect, it } from "vitest";
import { generateBuildPackage } from "./generator";

describe("generateBuildPackage", () => {
  it("detects AI + image + payments features and prices them in", () => {
    const pkg = generateBuildPackage({
      ventureName: "Nail Design Try-On",
      ideaText: "An AI app that generates nail art designs and lets users buy the look as a subscription.",
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
    expect(pkg.costEstimate.totalMonthly).toBeGreaterThan(0);
  });

  it("stays at near-zero cost for an idea with none of the detected features", () => {
    const pkg = generateBuildPackage({
      ventureName: "Bread Delivery",
      ideaText: "A simple list of local bakeries and their delivery hours.",
    });

    expect(pkg.recommendedStack.notableApis).toEqual([]);
    // Hosting/DB/auth free tier + ~$1/mo domain, nothing else.
    expect(pkg.costEstimate.totalMonthly).toBe(1);
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

  it("totalMonthly always equals the sum of its own line items", () => {
    const pkg = generateBuildPackage({
      ventureName: "Everything App",
      ideaText: "AI chat assistant with image generation and paid subscriptions.",
    });
    const sum = pkg.costEstimate.items.reduce((s, i) => s + i.monthlyCost, 0);
    expect(pkg.costEstimate.totalMonthly).toBe(sum);
  });
});
