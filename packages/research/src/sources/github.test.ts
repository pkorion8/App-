import { describe, expect, it } from "vitest";
import { truncateDescription } from "./github";

describe("truncateDescription", () => {
  it("leaves a short description untouched", () => {
    expect(truncateDescription("A simple todo app")).toBe("A simple todo app");
  });

  it("caps a wildly long description (regression: a real GitHub repo's description turned out to be an entire copy-pasted movie script and was dumped unbounded into a finding's text)", () => {
    const huge = "word ".repeat(5000).trim();
    const result = truncateDescription(huge);
    expect(result).not.toBeNull();
    expect(result!.length).toBeLessThan(200);
    expect(result!.endsWith("…")).toBe(true);
  });

  it("is null for a missing description rather than throwing", () => {
    expect(truncateDescription(null)).toBeNull();
  });

  it("trims surrounding whitespace", () => {
    expect(truncateDescription("  padded  ")).toBe("padded");
  });
});
