import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { isSupabaseConfigured } from "@venture-sandbox/integrations";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const journey = [
  ["Understand", "research"],
  ["Shape", "shape"],
  ["Simulate", "simulate"],
  ["Build", "build"],
  ["Learn", "monitor"],
] as const;

const intelligence = [
  ["Evidence", "evidence"],
  ["Technology", "technology"],
  ["Feed", "feed"],
  ["Compare", "compare"],
  ["Investor World", "investor"],
  ["Scorecard", "scorecard"],
  ["System", "system"],
] as const;

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
        <Link href={`/venture/${id}`} className="min-w-0 flex-1 border-l border-vs-border pl-4"><span className="block truncate font-semibold text-vs-fg">{venture.name}</span><span className="block truncate text-xs text-vs-fg-muted">{venture.target_user || "Audience not shaped"} · {venture.geography || "Market not chosen"}</span></Link>
        <span className="rounded-full border border-vs-border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-vs-fg-muted">{venture.status.replaceAll("_", " ")}</span>
      </div>
      <div className="mx-auto max-w-6xl px-4 pb-3 sm:px-6">
        <nav aria-label="Venture journey" className="flex gap-1 overflow-x-auto">
          {journey.map(([label, route], index) => <Link key={route} href={`/venture/${id}/${route}`} className="flex shrink-0 items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium text-vs-fg-muted hover:bg-vs-bg-subtle hover:text-vs-fg"><span className="grid h-5 w-5 place-items-center rounded-full bg-vs-bg-subtle text-[11px]">{index + 1}</span>{label}</Link>)}
          <Link href={`/venture/${id}/monetization`} className="shrink-0 rounded-full border border-vs-primary/30 px-3 py-1.5 text-sm font-medium text-vs-primary">Monetization</Link>
        </nav>
        <nav aria-label="Venture intelligence" className="mt-2 flex gap-1 overflow-x-auto border-t border-vs-border/70 pt-2">
          <span className="shrink-0 px-2 py-1.5 text-[10px] font-semibold uppercase tracking-[.18em] text-vs-fg-muted">Intelligence</span>
          {intelligence.map(([label, route]) => <Link key={route} href={`/venture/${id}/${route}`} className="shrink-0 rounded-full px-3 py-1.5 text-xs font-medium text-vs-fg-muted hover:bg-vs-bg-subtle hover:text-vs-fg">{label}</Link>)}
        </nav>
      </div>
    </header>
    {children}
  </>;
}
