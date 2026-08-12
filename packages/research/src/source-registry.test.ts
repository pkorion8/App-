import { describe, expect, it } from "vitest";
import { SOURCE_REGISTRY, sourcesFor } from "./source-registry";

describe("source registry", () => {
  it("records unavailable intelligence explicitly", () => {
    expect(sourcesFor("reviews")[0]?.access).toBe("unavailable");
    expect(sourcesFor("pricing")[0]?.limitations).toContain("must not be inferred");
  });
  it("keeps live integrations and limitations together", () => {
    const apple = SOURCE_REGISTRY.find((s) => s.provider.includes("iTunes"));
    expect(apple?.access).toBe("live");
    expect(apple?.limitations.length).toBeGreaterThan(10);
  });
});
