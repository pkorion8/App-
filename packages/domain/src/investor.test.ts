import { describe, expect, it } from "vitest";
import { boundCounter, classifyFounderClaim, equityDeal, investorQuestions } from "./investor";

describe("investor domain", () => {
  it("calculates ownership deterministically", () => {
    const d = equityDeal({ investment: 500000, preMoney: 2000000, employeePoolPct: 10 });
    expect(d.postMoney).toBe(2500000);
    expect(d.investorPct).toBe(20);
    expect(d.founderPct).toBe(70);
  });
  it("bounds counter values", () => {
    expect(boundCounter({ investment: 1, preMoney: 999999999 })).toEqual({ investment: 5000, preMoney: 50000000 });
  });
  it("uses venture context in questions", () => {
    expect(investorQuestions("operator-angel", { audience: "independent tutors", problem: "manual scheduling" })[0]).toContain("independent tutors");
  });
  it("does not promote unsupported answers to facts", () => {
    expect(classifyFounderClaim("We will reach 10000 users")).toBe("NEW CLAIM");
    expect(classifyFounderClaim("I think customers will pay")).toBe("ASSUMPTION");
  });
});
