import { prisma } from "@chatcartpro/db";
import { getCurrentSession } from "@/lib/auth/get-current-tenant";

export default async function CampaignsPage() {
  const session = await getCurrentSession();
  const tenantId = session!.user!.tenantId;
  const campaigns = await prisma.campaign.findMany({
    where: { tenantId },
    take: 50,
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="rounded-2xl bg-[var(--card)] p-5">
      <h1 className="text-xl font-bold mb-4">Campaigns</h1>
      {campaigns.length === 0 ? (
        <p className="text-sm text-[var(--muted)]">No campaigns yet.</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[var(--muted)]">
              <th className="py-2">Name</th>
              <th className="py-2">Status</th>
              <th className="py-2">Sent</th>
              <th className="py-2">Delivered</th>
              <th className="py-2">Read</th>
              <th className="py-2">Failed</th>
            </tr>
          </thead>
          <tbody>
            {campaigns.map((c) => (
              <tr key={c.id} className="border-t border-[var(--border)]">
                <td className="py-2">{c.name}</td>
                <td className="py-2">{c.status}</td>
                <td className="py-2">{c.sentCount}</td>
                <td className="py-2">{c.deliveredCount}</td>
                <td className="py-2">{c.readCount}</td>
                <td className="py-2">{c.failedCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
