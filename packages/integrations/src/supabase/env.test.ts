import { describe, expect, it } from "vitest";
import { isSupabaseConfigured, resolveSupabaseEnv } from "./env";

describe("Supabase environment validation", () => {
  it("accepts a valid project origin and trims surrounding whitespace", () => {
    const input = {
      url: "  https://example.supabase.co/  ",
      anonKey: "  public-key  ",
    };

    expect(isSupabaseConfigured(input)).toBe(true);
    expect(resolveSupabaseEnv(input)).toEqual({
      url: "https://example.supabase.co",
      anonKey: "public-key",
    });
  });

  it("treats malformed or unsupported URLs as unconfigured", () => {
    expect(
      isSupabaseConfigured({ url: "not-a-url", anonKey: "public-key" }),
    ).toBe(false);
    expect(
      isSupabaseConfigured({ url: "ftp://example.com", anonKey: "public-key" }),
    ).toBe(false);
  });

  it("treats blank project keys as unconfigured", () => {
    expect(
      isSupabaseConfigured({
        url: "https://example.supabase.co",
        anonKey: "   ",
      }),
    ).toBe(false);
  });

  it("fails with a deployment-focused message when configuration is invalid", () => {
    expect(() =>
      resolveSupabaseEnv({ url: "https://example.supabase.co", anonKey: "" }),
    ).toThrow(/not configured correctly/i);
  });
});
