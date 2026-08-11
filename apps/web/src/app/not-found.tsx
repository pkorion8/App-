import Link from "next/link";
import { Button, Card } from "@venture-sandbox/ui";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <Card className="max-w-md text-center">
        <h1 className="text-xl font-semibold text-vs-fg">Not found</h1>
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
