import { redirect } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { getCurrentSession } from "@/lib/auth/get-current-tenant";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getCurrentSession();

  // No Supabase session at all -> middleware already redirects to /login,
  // but this also guards direct navigation edge cases.
  if (!session) redirect("/login");

  // Supabase account exists but hasn't finished tenant onboarding yet.
  if (!session.user) redirect("/onboarding");

  return (
    <div className="flex min-h-screen gap-5 p-5">
      <Sidebar tenantName={session.user.tenant.name} />
      <main className="flex-1 min-w-0 flex flex-col gap-5">{children}</main>
    </div>
  );
}
