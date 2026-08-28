import { describe, expect, it } from "vitest";
import {
  SOURCE_REGISTRY,
  isCategoryAvailable,
  sourceFor,
  sourcesFor,
} from "./source-registry";

describe("source registry", () => {
  it("records unavailable intelligence explicitly", () => {
    expect(sourcesFor("reviews")[0]?.access).toBe("unavailable");
    expect(sourcesFor("pricing")[0]?.claimBoundary).toContain("Do not infer or fabricate competitor pricing");
    expect(isCategoryAvailable("regulatory")).toBe(false);
  });

  it("keeps live integrations and limitations together", () => {
    const apple = SOURCE_REGISTRY.find((s) => s.provider.includes("iTunes"));
    expect(apple?.access).toBe("live");
    expect(apple?.limitations.length).toBeGreaterThan(10);
    expect(apple?.claimBoundary).toContain("Must not label those signals as traction");
  });

  it("prevents source signals from becoming unsupported business claims", () => {
    expect(sourceFor("market")?.claimBoundary).toContain("Must not convert population");
    expect(sourceFor("technology")?.claimBoundary).toContain("Must not treat repository counts or activity as customer demand");
    expect(sourceFor("reviews")?.claimBoundary).toContain("Do not infer, synthesize or fabricate review sentiment");
  });

  it("exposes only connected or partial categories as available", () => {
    expect(isCategoryAvailable("competitors")).toBe(true);
    expect(isCategoryAvailable("market")).toBe(true);
    expect(isCategoryAvailable("technology")).toBe(true);
    expect(isCategoryAvailable("reviews")).toBe(false);
    expect(isCategoryAvailable("pricing")).toBe(false);
  });
});
