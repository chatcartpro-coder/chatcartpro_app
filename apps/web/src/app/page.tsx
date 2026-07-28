import Link from "next/link";

export default function LandingRedirectPage() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold">ChatCart Pro</h1>
        <p className="mt-2 text-[var(--muted)]">
          <Link href="/dashboard" className="underline">
            Go to dashboard
          </Link>
        </p>
      </div>
    </main>
  );
}
