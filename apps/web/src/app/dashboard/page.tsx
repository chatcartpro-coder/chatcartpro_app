import { prisma } from "@chatcartpro/db";
import { getCurrentSession } from "@/lib/auth/get-current-tenant";

export default async function DashboardPage() {
  // DashboardLayout already redirects to /login or /onboarding if this is
  // missing, so session.user is guaranteed non-null here.
  const session = await getCurrentSession();
  const tenantId = session!.user!.tenantId;

  const [contactCount, messageCount, campaignCount, waba] = await Promise.all([
    prisma.contact.count({ where: { tenantId } }),
    prisma.message.count({ where: { conversation: { tenantId } } }),
    prisma.campaign.count({ where: { tenantId } }),
    prisma.wabaConnection.findFirst({ where: { tenantId } }),
  ]);

  const stats = [
    { label: "Contacts", value: contactCount },
    { label: "Messages", value: messageCount },
    { label: "Campaigns", value: campaignCount },
    { label: "WABA status", value: waba ? waba.qualityRating ?? "Connected" : "Not connected" },
  ];

  return (
    <>
      <div className="rounded-2xl bg-[var(--card)] p-5">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          {waba?.displayName ?? "No WhatsApp number connected yet"}
        </p>
      </div>
      <div className="grid grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-2xl bg-[var(--card)] p-5">
            <div className="text-sm font-medium text-[var(--muted)]">{stat.label}</div>
            <div className="mt-2 text-2xl font-bold">{stat.value}</div>
          </div>
        ))}
      </div>
    </>
  );
}
