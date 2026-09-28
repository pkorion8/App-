import Link from "next/link";
import { Button, Card } from "@venture-sandbox/ui";

export default function NotFound() {
  return (
    <main className="grid-paper flex min-h-screen items-center justify-center bg-vs-mint-soft p-6">
      <Card className="max-w-md bg-white/85 text-center shadow-panel">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-vs-lavender-soft text-lg font-semibold" aria-hidden>404</span>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-vs-fg">Page not found</h1>
        <p className="mt-2 text-sm text-vs-fg-muted">
          This page — or the venture it points to — doesn&apos;t exist, or you don&apos;t have
          access to it.
        </p>
        <Link href="/dashboard" className="mt-6 inline-block">
          <Button>Back to your ventures</Button>
        </Link>
      </Card>
    </main>
  );
}
