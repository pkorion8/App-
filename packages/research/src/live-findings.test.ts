import { describe, expect, it, vi } from "vitest";

vi.mock("./sources/itunes-search", () => ({ searchAppStore: vi.fn(async () => []) }));
vi.mock("./sources/github", () => ({ searchGitHubRepos: vi.fn(async () => []) }));

import { searchAppStore } from "./sources/itunes-search";
import { searchGitHubRepos } from "./sources/github";
import {
  classifyRatingVolume,
  isActivelyMaintained,
  isNewcomer,
  researchAppStoreCompetitors,
  researchGitHubActivity,
} from "./live-findings";

describe("classifyRatingVolume", () => {
  it("derives a descriptive band from public App Store rating counts only", () => {
    expect(classifyRatingVolume([])).toBe("Low");
    expect(classifyRatingVolume([99])).toBe("Low");
    expect(classifyRatingVolume([100])).toBe("Medium");
    expect(classifyRatingVolume([999])).toBe("Medium");
    expect(classifyRatingVolume([1000])).toBe("High");
  });

  it("emits ratingVolumeBand metadata without the legacy traction key", async () => {
    vi.mocked(searchAppStore).mockReset();
    vi.mocked(searchAppStore).mockResolvedValueOnce([
      {
        appId: 1,
        name: "Example App",
        seller: "Example Seller",
        rating: 4.6,
        ratingCount: 1200,
        price: "Free",
        url: "https://example.com",
        genre: "Productivity",
        lastUpdated: "2026-08-01T00:00:00Z",
        releaseDate: "2025-01-01T00:00:00Z",
      },
    ]);

    const finding = await researchAppStoreCompetitors({
      ventureName: "Example",
      ideaText: "Example productivity app",
      geography: "Canada",
    });

    expect(finding?.metadata?.kind).toBe("competitors");
    if (finding?.metadata?.kind === "competitors") {
      expect(finding.metadata.ratingVolumeBand).toBe("High");
      expect(finding.metadata.traction).toBeUndefined();
    }
    expect(finding?.userFacingSummary).toContain("Rating-volume band: High");
    expect(finding?.limitations).toContain("do not establish downloads, revenue, market share, product success, or traction");
  });
});

describe("isNewcomer", () => {
  it("treats a release from a few months ago as a newcomer", () => {
    const threeMonthsAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
    expect(isNewcomer(threeMonthsAgo)).toBe(true);
  });

  it("does not treat a multi-year-old app as a newcomer", () => {
    const fiveYearsAgo = new Date(Date.now() - 5 * 365 * 24 * 60 * 60 * 1000).toISOString();
    expect(isNewcomer(fiveYearsAgo)).toBe(false);
  });

  it("treats exactly-365-days-ago as still within the window, 366 as not", () => {
    const day = 24 * 60 * 60 * 1000;
    expect(isNewcomer(new Date(Date.now() - 365 * day).toISOString())).toBe(true);
    expect(isNewcomer(new Date(Date.now() - 366 * day).toISOString())).toBe(false);
  });

  it("is false for missing or unparseable dates rather than throwing", () => {
    expect(isNewcomer(null)).toBe(false);
    expect(isNewcomer("not a date")).toBe(false);
  });
});

describe("isActivelyMaintained", () => {
  it("treats a repo pushed to last week as active", () => {
    const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    expect(isActivelyMaintained(lastWeek)).toBe(true);
  });

  it("treats a repo untouched for 2 years as inactive", () => {
    const twoYearsAgo = new Date(Date.now() - 2 * 365 * 24 * 60 * 60 * 1000).toISOString();
    expect(isActivelyMaintained(twoYearsAgo)).toBe(false);
  });

  it("is false for a missing pushedAt rather than throwing", () => {
    expect(isActivelyMaintained(null)).toBe(false);
  });
});

describe("idea-aware search query wiring", () => {
  it("passes idea-derived keywords to the App Store search, not just the bare venture name", async () => {
    vi.mocked(searchAppStore).mockReset();
    vi.mocked(searchAppStore).mockResolvedValue([]);
    await researchAppStoreCompetitors({
      ventureName: "Roti",
      ideaText: "Local roti ordering and delivery marketplace for South Asian customers in Vancouver",
      geography: "Canada",
    });
    expect(searchAppStore).toHaveBeenCalled();
    const [queryArg] = vi.mocked(searchAppStore).mock.calls[0]!;
    expect(queryArg.toLowerCase()).not.toBe("roti");
    expect(queryArg.toLowerCase()).toMatch(/ordering|delivery|marketplace/);
  });

  it("falls back to the bare venture name if the expanded App Store query finds nothing", async () => {
    vi.mocked(searchAppStore).mockReset();
    vi.mocked(searchAppStore).mockResolvedValue([]);
    await researchAppStoreCompetitors({
      ventureName: "Roti",
      ideaText: "Local roti ordering and delivery marketplace for South Asian customers in Vancouver",
      geography: "Canada",
    });
    expect(searchAppStore).toHaveBeenCalledTimes(2);
    const [secondQueryArg] = vi.mocked(searchAppStore).mock.calls[1]!;
    expect(secondQueryArg).toBe("Roti");
  });

  it("passes idea-derived keywords to the GitHub search, not just the bare venture name", async () => {
    vi.mocked(searchGitHubRepos).mockClear();
    await researchGitHubActivity({
      ventureName: "Roti",
      ideaText: "Local roti ordering and delivery marketplace for South Asian customers in Vancouver",
    });
    expect(searchGitHubRepos).toHaveBeenCalled();
    const [queryArg] = vi.mocked(searchGitHubRepos).mock.calls[0]!;
    expect(queryArg.toLowerCase()).not.toBe("roti");
  });
});
