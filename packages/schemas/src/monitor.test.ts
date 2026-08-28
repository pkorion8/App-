import { describe, expect, it } from "vitest";
import { addOutcomeSchema } from "./monitor";

describe("addOutcomeSchema", () => {
  it("accepts ordinary non-negative numeric observations", () => {
    expect(addOutcomeSchema.safeParse({ metricType: "users", metricValue: 250 }).success).toBe(true);
    expect(addOutcomeSchema.safeParse({ metricType: "revenue", metricValue: 1250.5 }).success).toBe(true);
  });

  it("keeps percentage-style observations within 0 to 100", () => {
    for (const metricType of ["retention", "conversion", "activation", "churn", "qualitative", "milestone"] as const) {
      expect(addOutcomeSchema.safeParse({ metricType, metricValue: 100 }).success).toBe(true);
      const result = addOutcomeSchema.safeParse({ metricType, metricValue: 101 });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((issue) => issue.path[0] === "metricValue")).toBe(true);
      }
    }
  });
});
