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
  ["Compare", "compare"],
  ["Investor World", "investor"],
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
    <div className="sticky top-0 z-30 px-3 pt-3 sm:px-5 sm:pt-5">
      <header className="vs-shell overflow-hidden rounded-vs-lg border border-vs-border/75 bg-white/95 shadow-[var(--vs-shadow-card)] backdrop-blur-xl">
        <div className="flex items-center gap-3 px-4 py-3.5 sm:px-5">
          <Link href="/dashboard" className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-vs-fg text-sm font-semibold text-white" aria-label="Back to ventures">←</Link>
          <Link href={`/venture/${id}`} className="min-w-0 flex-1">
            <span className="block truncate text-base font-semibold tracking-tight text-vs-fg">{venture.name}</span>
            <span className="block truncate text-xs text-vs-fg-muted">{venture.target_user || "Audience not shaped"} · {venture.geography || "Market not chosen"}</span>
          </Link>
          <span className="hidden rounded-full bg-vs-bg-subtle px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.14em] text-vs-fg-muted sm:inline-flex">{venture.status.replaceAll("_", " ")}</span>
        </div>

        <div className="border-t border-vs-border/65 px-3 py-2.5 sm:px-4">
          <nav aria-label="Venture journey" className="flex gap-1.5 overflow-x-auto pb-1">
            {journey.map(([label, route], index) => (
              <Link key={route} href={`/venture/${id}/${route}`} className="flex shrink-0 items-center gap-2 rounded-full bg-vs-bg-subtle/75 px-3 py-2 text-sm font-semibold text-vs-fg-muted transition hover:bg-vs-fg hover:text-white">
                <span className="grid h-5 w-5 place-items-center rounded-full bg-white text-[10px] text-vs-fg">{index + 1}</span>{label}
              </Link>
            ))}
            <Link href={`/venture/${id}/monetization`} className="shrink-0 rounded-full bg-vs-primary px-3.5 py-2 text-sm font-semibold text-white">Monetization</Link>
          </nav>
          <nav aria-label="Venture intelligence" className="mt-2 flex gap-1 overflow-x-auto">
            <span className="shrink-0 px-2 py-2 text-[10px] font-bold uppercase tracking-[.16em] text-vs-fg-muted">Intelligence</span>
            {intelligence.map(([label, route]) => <Link key={route} href={`/venture/${id}/${route}`} className="shrink-0 rounded-full px-3 py-2 text-xs font-semibold text-vs-fg-muted transition hover:bg-vs-bg-subtle hover:text-vs-fg">{label}</Link>)}
          </nav>
        </div>
      </header>
    </div>
    {children}
  </>;
}
