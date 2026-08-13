import { describe, expect, it } from "vitest";
import { boundCounter, classifyFounderClaim, equityDeal, evaluateInvestorAnswer, investorQuestions } from "./investor";

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

  it("ends a meeting for clearly abusive conduct", () => {
    const result = evaluateInvestorAnswer("That is a stupid question. Shut up and listen to me.");
    expect(result.outcome).toBe("end");
    expect(result.reason).toBe("conduct");
  });

  it("challenges vague answers instead of automatically advancing", () => {
    const result = evaluateInvestorAnswer("Trust me");
    expect(result.outcome).toBe("challenge");
    expect(result.clarity).toBe("weak");
  });

  it("challenges specific traction claims without uncertainty language", () => {
    const result = evaluateInvestorAnswer("We already have 20,000 paying customers and $300,000 monthly revenue from the product.");
    expect(result.outcome).toBe("challenge");
    expect(result.reason).toBe("unsupported_traction");
  });

  it("allows a substantive professional answer to continue", () => {
    const result = evaluateInvestorAnswer("Our current evidence is limited to interviews, so I would test willingness to pay with a small landing-page experiment before raising capital.");
    expect(result.outcome).toBe("continue");
    expect(result.trust).toBe("improving");
  });
});
