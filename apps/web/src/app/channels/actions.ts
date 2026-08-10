"use server";

import { redirect } from "next/navigation";
import { addChannelSchema } from "@venture-sandbox/schemas";
import { parseChannelInput } from "@venture-sandbox/research";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface AddChannelState {
  status: "idle" | "error";
  message?: string;
}

export async function addChannel(
  _prevState: AddChannelState,
  formData: FormData,
): Promise<AddChannelState> {
  const parsed = addChannelSchema.safeParse({
    channelInput: formData.get("channelInput"),
  });

  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  const { channelId, channelHandle } = parseChannelInput(parsed.data.channelInput);

  const { error } = await supabase.from("youtube_channels").insert({
    channel_id: channelId,
    channel_handle: channelHandle,
    channel_name: channelHandle ?? channelId,
    added_by: user.id,
  });

  if (error) {
    if (error.code === "23505") {
      return { status: "error", message: "That channel is already registered." };
    }
    return { status: "error", message: error.message };
  }

  redirect("/channels");
}
