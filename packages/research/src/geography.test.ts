import { describe, expect, it } from "vitest";
import { COUNTRY_OPTIONS, resolveCountryCode } from "./geography";

describe("resolveCountryCode", () => {
  it("resolves common names and aliases case-insensitively", () => {
    expect(resolveCountryCode("United States")).toBe("US");
    expect(resolveCountryCode("usa")).toBe("US");
    expect(resolveCountryCode("  Canada  ")).toBe("CA");
    expect(resolveCountryCode("UK")).toBe("GB");
  });

  it("returns null for text that isn't a known country", () => {
    expect(resolveCountryCode("Nowhereland")).toBeNull();
    expect(resolveCountryCode("")).toBeNull();
  });

  it("resolves every dropdown option it offers -- the picker must never show a value it can't itself resolve", () => {
    for (const option of COUNTRY_OPTIONS) {
      expect(resolveCountryCode(option.name)).toBe(option.code);
    }
  });

  it("has no duplicate ISO codes across the dropdown options", () => {
    const codes = COUNTRY_OPTIONS.map((o) => o.code);
    expect(new Set(codes).size).toBe(codes.length);
  });
});
