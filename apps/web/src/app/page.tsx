import Link from "next/link";
import { Button, Card } from "@venture-sandbox/ui";

export default function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <Card className="max-w-md text-center">
        <h1 className="text-2xl font-semibold text-vs-fg">Venture Sandbox</h1>
        <p className="mt-2 text-sm text-vs-fg-muted">
          Research an idea, simulate building and launching it, and decide
          before you spend real money.
        </p>
        <Link href="/sign-in" className="mt-6 inline-block">
          <Button>Sign in</Button>
        </Link>
      </Card>
    </main>
  );
}
