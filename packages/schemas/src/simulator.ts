import { z } from "zod";

export const startSimulationSchema = z.object({
  budgetTotal: z.coerce
    .number()
    .min(50, "Enter at least $50 to simulate with.")
    .max(1_000_000, "Keep it under $1,000,000 for now."),
});

export type StartSimulationFormValues = z.infer<typeof startSimulationSchema>;
