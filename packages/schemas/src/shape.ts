import { z } from "zod";

export const PRICING_MODELS = ["subscription", "one_time", "commission", "ad_supported"] as const;

export const shapeSchema = z.object({
  targetUser: z.string().trim().min(1, "Tell us who this is for.").max(200),
  geography: z.string().trim().min(1, "Pick a market."),
  problemStatement: z.string().trim().max(1000).optional(),
  valueProposition: z.string().trim().max(1000).optional(),
  mvpScope: z.string().trim().max(1000).optional(),
  differentiation: z.string().trim().max(1000).optional(),
  pricingModel: z.enum(PRICING_MODELS).optional(),
});

export type ShapeFormValues = z.infer<typeof shapeSchema>;
