import { z } from "zod";

export const createVentureSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "Give the venture a name (at least 3 characters).")
    .max(120, "Keep the name under 120 characters."),
  rawIdeaText: z
    .string()
    .trim()
    .min(10, "Describe the idea in a bit more detail (at least 10 characters).")
    .max(4000, "Keep the idea description under 4000 characters."),
});

export type CreateVentureFormValues = z.infer<typeof createVentureSchema>;
