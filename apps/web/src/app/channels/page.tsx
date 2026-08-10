import Link from "next/link";
import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@venture-sandbox/integrations";
import { Card } from "@venture-sandbox/ui";
import { SupabaseSetupNotice } from "@/components/SupabaseSetupNotice";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AddChannelForm } from "./AddChannelForm";

export const dynamic = "force-dynamic";

function isResolvedId(channelId: string): boolean {
  return /^UC[\w-]{22}$/.test(channelId);
}

export default async function ChannelsPage() {
  const configured = isSupabaseConfigured({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  });

  if (!configured) {
    return <SupabaseSetupNotice />;
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  const { data: channels } = await supabase
    .from("youtube_channels")
    .select("id, channel_id, channel_handle, channel_name, is_active, last_checked_at, created_at")
    .order("created_at", { ascending: false });

  const { data: recentClaims } = await supabase
    .from("creator_claims")
    .select("id, video_title, video_url, claim_type, claim_text, confidence, created_at")
    .order("created_at", { ascending: false })
    .limit(10);

  const unresolvedCount = (channels ?? []).filter((c) => !isResolvedId(c.channel_id)).length;

  return (
    <main className="mx-auto max-w-3xl p-6">
      <Link href="/dashboard" className="text-sm text-vs-fg-muted hover:underline">
        ← Your ventures
      </Link>

      <h1 className="mt-4 text-xl font-semibold text-vs-fg">Monitored channels</h1>
      <p className="mt-1 text-sm text-vs-fg-muted">
        Shared across everyone — this is the platform&apos;s own accumulating
        research base, not tied to one venture. A daily job checks each
        channel for new uploads and pulls out builder claims (cost, revenue,
        users, tools) where a transcript is available.
      </p>

      <Card className="mt-4">
        <AddChannelForm />
      </Card>

      {unresolvedCount > 0 && (
        <Card className="mt-4 bg-vs-bg-subtle">
          <p className="text-sm text-vs-fg-muted">
            {unresolvedCount} channel{unresolvedCount === 1 ? "" : "s"} added by
            handle, not yet resolved to a real channel ID — that needs a
            connected YouTube API key. They won&apos;t be checked until then.
          </p>
        </Card>
      )}

      <div className="mt-6 space-y-2">
        {channels && channels.length > 0 ? (
          channels.map((c) => (
            <Card key={c.id} className="flex items-center justify-between">
              <div>
                <p className="font-medium text-vs-fg">{c.channel_name ?? c.channel_id}</p>
                <p className="text-xs text-vs-fg-muted">
                  {isResolvedId(c.channel_id) ? "Resolved" : "Needs resolution"} ·{" "}
                  {c.last_checked_at
                    ? `last checked ${new Date(c.last_checked_at).toLocaleDateString()}`
                    : "not checked yet"}
                </p>
              </div>
              <span className="text-xs uppercase tracking-wide text-vs-fg-muted">
                {c.is_active ? "active" : "paused"}
              </span>
            </Card>
          ))
        ) : (
          <Card className="text-sm text-vs-fg-muted">No channels added yet.</Card>
        )}
      </div>

      <h2 className="mt-8 text-lg font-semibold text-vs-fg">Recent claims</h2>
      <div className="mt-3 space-y-2">
        {recentClaims && recentClaims.length > 0 ? (
          recentClaims.map((claim) => (
            <Card key={claim.id}>
              <div className="flex items-start justify-between gap-3">
                <a
                  href={claim.video_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm font-medium text-vs-primary hover:underline"
                >
                  {claim.video_title}
                </a>
                <span className="shrink-0 rounded-vs-sm bg-vs-bg-subtle px-2 py-0.5 text-xs uppercase tracking-wide text-vs-fg-muted">
                  {claim.claim_type}
                </span>
              </div>
              <p className="mt-1 text-sm text-vs-fg-muted">{claim.claim_text}</p>
              <p className="mt-1 text-xs text-vs-fg-muted">
                {claim.confidence === "unverified" ? "Creator claim, unverified" : "Corroborated"}
              </p>
            </Card>
          ))
        ) : (
          <Card className="text-sm text-vs-fg-muted">
            Nothing extracted yet — the daily job hasn&apos;t run, or nothing new was found.
          </Card>
        )}
      </div>
    </main>
  );
}
