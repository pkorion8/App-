import { describe, expect, it } from "vitest";
import { compareSnapshots } from "./trend";

describe("compareSnapshots", () => {
  it("flags growth when rating count increased since the previous snapshot", () => {
    const result = compareSnapshots(
      [{ appId: 1, name: "App A", ratingCount: 150 }],
      [{ appId: 1, ratingCount: 100, checkedAt: new Date(Date.now() - 7 * 86400000).toISOString() }],
    );
    expect(result).toHaveLength(1);
    expect(result[0]!.direction).toBe("up");
    expect(result[0]!.delta).toBe(50);
    expect(result[0]!.daysSincePrevious).toBe(7);
  });

  it("flags decline when rating count dropped (e.g. Apple corrected inflated numbers)", () => {
    const result = compareSnapshots(
      [{ appId: 1, name: "App A", ratingCount: 80 }],
      [{ appId: 1, ratingCount: 100, checkedAt: new Date().toISOString() }],
    );
    expect(result[0]!.direction).toBe("down");
    expect(result[0]!.delta).toBe(-20);
  });

  it("flags flat when nothing changed", () => {
    const result = compareSnapshots(
      [{ appId: 1, name: "App A", ratingCount: 100 }],
      [{ appId: 1, ratingCount: 100, checkedAt: new Date().toISOString() }],
    );
    expect(result[0]!.direction).toBe("flat");
  });

  it("skips apps with no previous snapshot -- first-ever check has no trend to show", () => {
    const result = compareSnapshots([{ appId: 999, name: "New App", ratingCount: 10 }], []);
    expect(result).toEqual([]);
  });

  it("only compares apps present in both current and previous, matched by appId not name", () => {
    const result = compareSnapshots(
      [
        { appId: 1, name: "App A", ratingCount: 100 },
        { appId: 2, name: "App B", ratingCount: 200 },
      ],
      [{ appId: 1, ratingCount: 90, checkedAt: new Date().toISOString() }],
    );
    expect(result).toHaveLength(1);
    expect(result[0]!.appId).toBe(1);
  });
});
