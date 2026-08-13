import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { isSupabaseConfigured } from "@venture-sandbox/integrations";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { VentureModeNav } from "./VentureModeNav";

export default async function VentureLayout({ children, params }: { children: React.ReactNode; params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isSupabaseConfigured({ url: process.env.NEXT_PUBLIC_SUPABASE_URL, anonKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY })) return children;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");
  const { data: venture } = await supabase.from("ventures").select("id, name, status, target_user, geography").eq("id", id).maybeSingle();
  if (!venture) notFound();
  return <>
    <header className="sticky top-0 z-30 border-b border-vs-border bg-vs-bg/90 shadow-sm backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3 sm:px-6">
        <Link href="/dashboard" className="text-sm text-vs-fg-muted hover:text-vs-fg">← My Ventures</Link>
        <Link href={`/venture/${id}`} className="min-w-0 flex-1 border-l border-vs-border pl-4"><span className="block truncate font-semibold text-vs-fg">{venture.name}</span><span className="block truncate text-xs text-vs-fg-muted">{venture.target_user || "Who it is for: not decided yet"} · {venture.geography || "Launch market: not decided yet"}</span></Link>
        <span className="hidden rounded-full border border-vs-border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-vs-fg-muted sm:inline">{venture.status.replaceAll("_", " ")}</span>
      </div>
      <VentureModeNav ventureId={id} />
    </header>
    {children}
  </>;
}
