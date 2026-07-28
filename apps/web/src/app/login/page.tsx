import Link from "next/link";
import { login } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-sm rounded-2xl bg-[var(--card)] p-8">
        <h1 className="text-xl font-bold">Log in</h1>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        <form action={login} className="mt-6 flex flex-col gap-4">
          <input
            name="email"
            type="email"
            required
            placeholder="Email"
            className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
          />
          <input
            name="password"
            type="password"
            required
            placeholder="Password"
            className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white"
          >
            Log in
          </button>
        </form>
        <p className="mt-4 text-sm text-[var(--muted)]">
          No account? <Link href="/signup" className="underline">Sign up</Link>
        </p>
      </div>
    </main>
  );
}
