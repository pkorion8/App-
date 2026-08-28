import { z } from "zod";

export const METRIC_TYPES = ["users", "revenue", "cost", "retention", "conversion", "activation", "churn", "qualitative", "milestone", "other"] as const;

const PERCENTAGE_METRICS = new Set(["retention", "conversion", "activation", "churn", "qualitative", "milestone"]);

export const addOutcomeSchema = z.object({
  metricType: z.enum(METRIC_TYPES),
  metricValue: z.coerce.number().min(0, "Enter a non-negative number.").max(1_000_000_000),
  note: z.string().max(500).optional(),
}).superRefine((value, context) => {
  if (PERCENTAGE_METRICS.has(value.metricType) && value.metricValue > 100) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["metricValue"],
      message: "Enter a value from 0 to 100 for this metric.",
    });
  }
});

export type AddOutcomeFormValues = z.infer<typeof addOutcomeSchema>;
