import { z } from "zod";

export const addChannelSchema = z.object({
  // Accepts a full channel URL, an @handle, or a raw channel ID (UC...) --
  // parsed server-side. See actions.ts for why: without a connected
  // YouTube API key yet, handle-to-ID resolution can't happen server-side,
  // so this stores whatever is recognizable and flags the rest for a
  // later resolution pass.
  channelInput: z
    .string()
    .trim()
    .min(3, "Paste a channel URL, @handle, or channel ID.")
    .max(300, "That's too long to be a channel URL or handle."),
});

export type AddChannelFormValues = z.infer<typeof addChannelSchema>;
