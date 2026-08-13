"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

async function ventureWorkspace(ventureId: string) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");
  const db = supabase as any;
  const { data: venture } = await db.from("ventures").select("workspace_id").eq("id", ventureId).maybeSingle();
  return venture ? { db, workspaceId: venture.workspace_id as string } : null;
}

export async function addVentureNote(formData: FormData) {
  const ventureId = String(formData.get("ventureId") || "");
  const note = String(formData.get("note") || "").trim();
  if (!note) return;
  const ctx = await ventureWorkspace(ventureId);
  if (!ctx) return;
  await ctx.db.from("venture_notes").insert({ venture_id: ventureId, workspace_id: ctx.workspaceId, note: note.slice(0, 4000) });
  revalidatePath(`/venture/${ventureId}`);
}

export async function addVentureResource(formData: FormData) {
  const ventureId = String(formData.get("ventureId") || "");
  const title = String(formData.get("title") || "").trim();
  const url = String(formData.get("url") || "").trim();
  const resourceType = String(formData.get("resourceType") || "link");
  const notes = String(formData.get("notes") || "").trim();
  if (!title) return;
  const ctx = await ventureWorkspace(ventureId);
  if (!ctx) return;
  await ctx.db.from("venture_resources").insert({
    venture_id: ventureId,
    workspace_id: ctx.workspaceId,
    title: title.slice(0, 300),
    url: url ? url.slice(0, 2000) : null,
    resource_type: ["link","document","video","tool","other"].includes(resourceType) ? resourceType : "other",
    notes: notes ? notes.slice(0, 2000) : null,
  });
  revalidatePath(`/venture/${ventureId}`);
}
