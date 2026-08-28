import { describe, expect, it } from "vitest";
import { safeInternalDestination } from "./safe-internal-destination";

describe("safeInternalDestination", () => {
  it("keeps ordinary internal destinations including query state", () => {
    expect(safeInternalDestination("/venture/abc/simulate?run=123")).toBe(
      "/venture/abc/simulate?run=123",
    );
  });

  it("uses the requested fallback for empty or external destinations", () => {
    expect(safeInternalDestination(null, "/sign-in")).toBe("/sign-in");
    expect(safeInternalDestination("https://evil.example", "/sign-in")).toBe("/sign-in");
    expect(safeInternalDestination("//evil.example", "/sign-in")).toBe("/sign-in");
  });

  it("rejects backslash-based redirect tricks", () => {
    expect(safeInternalDestination("/\\evil.example")).toBe("/dashboard");
    expect(safeInternalDestination("/%5Cevil.example")).toBe("/dashboard");
  });

  it("rejects encoded protocol-relative destinations", () => {
    expect(safeInternalDestination("/%2F%2Fevil.example")).toBe("/dashboard");
  });

  it("rejects literal and encoded control characters", () => {
    expect(safeInternalDestination("/venture/abc\n/compare")).toBe("/dashboard");
    expect(safeInternalDestination("/venture/abc%0A/compare")).toBe("/dashboard");
    expect(safeInternalDestination("/venture/abc%00/compare")).toBe("/dashboard");
  });

  it("rejects malformed percent encoding", () => {
    expect(safeInternalDestination("/venture/%E0%A4%A")).toBe("/dashboard");
  });
});
