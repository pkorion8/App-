import { describe, expect, it } from "vitest";
import { createMonetizationExperiments } from "./monetization";

describe("monetization experiments", () => {
  it("uses saved context and names missing pricing and cost evidence", () => {
    const cards = createMonetizationExperiments({
      audience: "independent tutors",
      geography: "Japan",
      product: "lesson scheduling",
      pricingModel: "subscription",
      hasCompetitorPricing: false,
    });

    expect(cards[0]!.hypothesis).toContain("independent tutors");
    expect(cards[0]!.evidence.join(" ")).toContain("Source-backed operating-cost pricing is not connected");
    expect(cards[0]!.evidence.join(" ")).not.toMatch(/\$\d+/);
    expect(cards.every((c) => c.evidence.some((e) => e.includes("does not exist")))).toBe(true);
  });

  it("exposes simulator-compatible overrides", () => {
    const cards = createMonetizationExperiments({ hasCompetitorPricing: false });
    expect(cards.find((c) => c.key === "monthly-annual")?.pricingModelOverride).toBe("subscription");
    expect(cards.find((c) => c.key === "one-time-recurring")?.pricingModelOverride).toBe("one_time");
  });
});
