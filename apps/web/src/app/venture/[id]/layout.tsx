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
    <header className="z-30 border-b border-vs-border/70 bg-vs-bg/90 backdrop-blur-xl sm:sticky sm:top-0">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:gap-4 sm:px-6 lg:px-8">
        <Link href="/dashboard" className="flex shrink-0 items-center gap-2 text-xs font-semibold text-vs-fg-muted hover:text-vs-fg sm:text-sm"><span className="grid h-8 w-8 place-items-center rounded-xl bg-vs-lime text-vs-ink">S</span><span className="hidden sm:inline">My Ventures</span></Link>
        <Link href={`/venture/${id}`} className="min-w-0 flex-1 border-l border-vs-border pl-3 sm:pl-4"><span className="block truncate font-semibold text-vs-fg">{venture.name}</span><span className="block truncate text-xs text-vs-fg-muted">{venture.target_user || "Who it is for: not decided yet"} · {venture.geography || "Launch market: not decided yet"}</span></Link>
        <span className="hidden rounded-full border border-vs-ink/10 bg-white/60 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[.12em] text-vs-fg-muted sm:inline">{venture.status.replaceAll("_", " ")}</span>
      </div>
      <VentureModeNav ventureId={id} />
    </header>
    {children}
  </>;
}
