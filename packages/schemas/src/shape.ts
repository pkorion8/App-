import { z } from "zod";

export const shapeSchema = z.object({
  targetUser: z.string().trim().min(1, "Tell us who this is for.").max(200),
  geography: z.string().trim().min(1, "Pick a market."),
  problemStatement: z.string().trim().max(1000).optional(),
  valueProposition: z.string().trim().max(1000).optional(),
  mvpScope: z.string().trim().max(1000).optional(),
  differentiation: z.string().trim().max(1000).optional(),
});

export type ShapeFormValues = z.infer<typeof shapeSchema>;
