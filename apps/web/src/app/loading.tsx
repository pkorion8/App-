export default function Loading() {
  return (
    <main className="mx-auto min-h-screen max-w-7xl animate-pulse p-4 sm:p-6 lg:p-8" aria-busy="true" aria-label="Loading page">
      <div className="h-40 rounded-[32px] border border-vs-border bg-vs-lavender-soft" />
      <div className="mt-5 grid gap-5 md:grid-cols-3">
        <div className="h-48 rounded-[28px] border border-vs-border bg-white/70" />
        <div className="h-48 rounded-[28px] border border-vs-border bg-vs-mint-soft" />
        <div className="h-48 rounded-[28px] border border-vs-border bg-vs-orange-soft" />
      </div>
      <div className="mt-5 h-64 rounded-[28px] border border-vs-border bg-white/70" />
      <span className="sr-only">Loading Sim Venture</span>
    </main>
  );
}
