import { describe, expect, it } from "vitest";
import { isActivelyMaintained, isNewcomer } from "./live-findings";

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
