import { describe, expect, it } from "vitest";
import { resolvePublicOrigin } from "./public-origin";

describe("resolvePublicOrigin", () => {
  it("prefers an explicitly configured public site URL", () => {
    expect(
      resolvePublicOrigin({
        configuredSiteUrl: "https://simventure.example.com/",
        forwardedHost: "preview.example.vercel.app",
        forwardedProto: "https",
        requestOrigin: "http://internal:3000",
      }),
    ).toBe("https://simventure.example.com");
  });

  it("uses the first forwarded host and protocol for preview deployments", () => {
    expect(
      resolvePublicOrigin({
        forwardedHost: "preview.example.vercel.app, internal.local",
        forwardedProto: "https, http",
        requestOrigin: "http://internal:3000",
      }),
    ).toBe("https://preview.example.vercel.app");
  });

  it("rejects malformed configured URLs and unsafe forwarded hosts", () => {
    expect(
      resolvePublicOrigin({
        configuredSiteUrl: "javascript:alert(1)",
        forwardedHost: "evil.example/path",
        forwardedProto: "https",
        requestOrigin: "https://safe.example.com",
      }),
    ).toBe("https://safe.example.com");
  });

  it("falls back to localhost only when no usable public origin exists", () => {
    expect(resolvePublicOrigin({})).toBe("http://localhost:3000");
  });
});
