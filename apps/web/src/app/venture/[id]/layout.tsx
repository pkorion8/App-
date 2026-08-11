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

export default async function VentureLayout({ children, params }: { children: React.ReactNode; params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isSupabaseConfigured({ url: process.env.NEXT_PUBLIC_SUPABASE_URL, anonKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY })) return children;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");
  const { data: venture } = await supabase.from("ventures").select("id, name, status, target_user, geography").eq("id", id).maybeSingle();
  if (!venture) notFound();
  return <>
    <header className="sticky top-0 z-20 border-b border-vs-border bg-vs-bg/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3 sm:px-6">
        <Link href={`/venture/${id}`} className="min-w-0 flex-1"><span className="block truncate font-semibold text-vs-fg">{venture.name}</span><span className="block truncate text-xs text-vs-fg-muted">{venture.target_user || "Audience not shaped"} · {venture.geography || "Market not chosen"}</span></Link>
        <span className="rounded-full border border-vs-border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-vs-fg-muted">{venture.status.replaceAll("_", " ")}</span>
        <Link href="/dashboard" className="text-sm text-vs-fg-muted hover:text-vs-fg">My ideas</Link>
      </div>
      <nav aria-label="Venture journey" className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 pb-3 sm:px-6">
        {journey.map(([label, route], index) => <Link key={route} href={`/venture/${id}/${route}`} className="flex shrink-0 items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium text-vs-fg-muted hover:bg-vs-bg-subtle hover:text-vs-fg"><span className="grid h-5 w-5 place-items-center rounded-full bg-vs-bg-subtle text-[11px]">{index + 1}</span>{label}</Link>)}
        <Link href={`/venture/${id}/monetization`} className="shrink-0 rounded-full border border-vs-primary/30 px-3 py-1.5 text-sm font-medium text-vs-primary">Monetization lab</Link>
      </nav>
    </header>
    {children}
  </>;
}
