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
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-xl">
      <div className="vs-shell">
        <div className="flex items-center gap-4 border-b border-black/5 py-4">
          <Link href="/dashboard" className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-black text-sm font-semibold text-white" aria-label="Back to ventures">←</Link>
          <Link href={`/venture/${id}`} className="min-w-0 flex-1">
            <span className="block truncate text-[17px] font-semibold tracking-[-.025em] text-black">{venture.name}</span>
            <span className="block truncate text-xs text-vs-fg-muted">{venture.target_user || "Audience not shaped"} · {venture.geography || "Market not chosen"}</span>
          </Link>
          <span className="hidden rounded-full bg-[#f4f4f1] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.12em] text-vs-fg-muted sm:inline-flex">{venture.status.replaceAll("_", " ")}</span>
        </div>

        <nav aria-label="Venture journey" className="flex gap-6 overflow-x-auto border-b border-black/5 py-3 text-sm">
          {journey.map(([label, route], index) => (
            <Link key={route} href={`/venture/${id}/${route}`} className="flex shrink-0 items-center gap-2 font-semibold text-vs-fg-muted hover:text-black">
              <span className="grid h-5 w-5 place-items-center rounded-full bg-[#f4f4f1] text-[10px] text-black">{index + 1}</span>{label}
            </Link>
          ))}
          <Link href={`/venture/${id}/monetization`} className="shrink-0 font-semibold text-vs-primary">Monetization</Link>
        </nav>

        <nav aria-label="Venture intelligence" className="flex gap-5 overflow-x-auto py-2.5 text-xs">
          <span className="shrink-0 font-bold uppercase tracking-[.14em] text-vs-fg-muted">Intelligence</span>
          {intelligence.map(([label, route]) => <Link key={route} href={`/venture/${id}/${route}`} className="shrink-0 font-semibold text-vs-fg-muted hover:text-black">{label}</Link>)}
        </nav>
      </div>
    </header>
    {children}
  </>;
}
