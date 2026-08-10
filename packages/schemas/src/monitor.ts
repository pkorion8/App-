import { z } from "zod";

export const METRIC_TYPES = ["users", "revenue", "cost", "retention", "other"] as const;

export const addOutcomeSchema = z.object({
  metricType: z.enum(METRIC_TYPES),
  metricValue: z.coerce.number().min(0, "Enter a non-negative number.").max(1_000_000_000),
  note: z.string().max(500).optional(),
});

export type AddOutcomeFormValues = z.infer<typeof addOutcomeSchema>;
