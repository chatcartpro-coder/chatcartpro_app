import { prisma } from "@chatcartpro/db";
import { getCurrentSession } from "@/lib/auth/get-current-tenant";

export default async function TemplatesPage() {
  const session = await getCurrentSession();
  const tenantId = session!.user!.tenantId;
  const templates = await prisma.template.findMany({
    where: { tenantId },
    take: 50,
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="rounded-2xl bg-[var(--card)] p-5">
      <h1 className="text-xl font-bold mb-4">Templates</h1>
      {templates.length === 0 ? (
        <p className="text-sm text-[var(--muted)]">
          No templates yet. Templates require Meta approval before they can be used in campaigns.
        </p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[var(--muted)]">
              <th className="py-2">Name</th>
              <th className="py-2">Category</th>
              <th className="py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {templates.map((t) => (
              <tr key={t.id} className="border-t border-[var(--border)]">
                <td className="py-2">{t.name}</td>
                <td className="py-2">{t.category}</td>
                <td className="py-2">{t.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
