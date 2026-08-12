export type ClaimState = "SUPPORTED" | "PARTIAL" | "ASSUMPTION" | "CONTRADICTED" | "NEW CLAIM" | "UNKNOWN";
export type InvestorStage = "readiness" | "screening" | "meeting" | "diligence" | "committee" | "negotiation" | "closed" | "passed";

export type InvestorContext = {
  audience?: string | null;
  problem?: string | null;
  differentiation?: string | null;
  hasResearch?: boolean;
  hasSimulation?: boolean;
};

export const INVESTOR_PROFILES = [
  { key: "operator-angel", name: "Operator Angel", focus: "Founder judgment, customer pain and execution", check: "$25k–$150k simulated range" },
  { key: "technical-angel", name: "Technical Angel", focus: "Technical feasibility, defensibility and dependency risk", check: "$25k–$200k simulated range" },
  { key: "micro-vc", name: "Micro-VC", focus: "Market, distribution, capital efficiency and follow-on potential", check: "$100k–$750k simulated range" },
] as const;

export function investorQuestions(profileKey: string, c: InvestorContext): string[] {
  const audience = c.audience || "your intended customer";
  const problem = c.problem || "the problem you are trying to solve";
  const differentiation = c.differentiation || "your differentiation";
  const common = [
    `What evidence shows that ${audience} experiences ${problem} strongly enough to change behavior?`,
    `Why is ${differentiation} difficult for an existing competitor to copy?`,
    c.hasResearch ? "Which research finding would you be most worried about being wrong?" : "What is the first external evidence you still need before asking for capital?",
    c.hasSimulation ? "Which simulation assumption has the greatest effect on runway or adoption?" : "Why raise now instead of learning more before taking capital?",
  ];
  if (profileKey === "technical-angel") return [common[0]!, "What technical dependency could become a single point of failure?", common[1]!, common[2]!, common[3]!];
  if (profileKey === "micro-vc") return [common[0]!, "How will you repeatedly acquire customers without relying on one channel?", common[1]!, common[2]!, common[3]!];
  return [common[0]!, "What founder decision would you make differently if your first ten customers disagree with you?", common[1]!, common[2]!, common[3]!];
}

export function classifyFounderClaim(answer: string, hasLinkedEvidence = false): ClaimState {
  const text = answer.trim();
  if (!text) return "UNKNOWN";
  if (hasLinkedEvidence) return "PARTIAL";
  if (/\b(i think|i believe|probably|maybe|assume|expect|we think|we believe)\b/i.test(text)) return "ASSUMPTION";
  return "NEW CLAIM";
}

export function nextInvestorStage(stage: InvestorStage): InvestorStage {
  const order: InvestorStage[] = ["readiness", "screening", "meeting", "diligence", "committee", "negotiation", "closed"];
  const i = order.indexOf(stage);
  return i < 0 || i === order.length - 1 ? stage : order[i + 1]!;
}

export function equityDeal(input: { investment: number; preMoney: number; employeePoolPct?: number }) {
  const investment = Math.max(0, input.investment);
  const preMoney = Math.max(1, input.preMoney);
  const postMoney = preMoney + investment;
  const investorPct = (investment / postMoney) * 100;
  const poolPct = Math.min(30, Math.max(0, input.employeePoolPct ?? 0));
  const founderPct = Math.max(0, 100 - investorPct - poolPct);
  return { investment, preMoney, postMoney, investorPct, employeePoolPct: poolPct, founderPct, founderDilutionPct: 100 - founderPct };
}

export function boundCounter(input: { investment: number; preMoney: number }) {
  return {
    investment: Math.min(5_000_000, Math.max(5_000, Math.round(input.investment))),
    preMoney: Math.min(50_000_000, Math.max(100_000, Math.round(input.preMoney))),
  };
}
