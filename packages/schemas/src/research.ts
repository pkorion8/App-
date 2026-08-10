import { z } from "zod";

// The spec's "2-question clarification" (§21.2 Slice 2): the two questions
// that materially change research — who it's for, and where.
export const clarificationSchema = z.object({
  targetUser: z
    .string()
    .trim()
    .min(3, "Say a bit about who this is for (at least 3 characters).")
    .max(200, "Keep this under 200 characters."),
  geography: z
    .string()
    .trim()
    .min(2, "Name a country or region (at least 2 characters).")
    .max(100, "Keep this under 100 characters."),
});

export type ClarificationFormValues = z.infer<typeof clarificationSchema>;
