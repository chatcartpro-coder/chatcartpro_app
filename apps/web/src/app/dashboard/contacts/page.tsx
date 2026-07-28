import { prisma } from "@chatcartpro/db";
import { getCurrentSession } from "@/lib/auth/get-current-tenant";

export default async function ContactsPage() {
  const session = await getCurrentSession();
  const tenantId = session!.user!.tenantId;
  const contacts = await prisma.contact.findMany({
    where: { tenantId },
    take: 50,
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="rounded-2xl bg-[var(--card)] p-5">
      <h1 className="text-xl font-bold mb-4">Contacts</h1>
      {contacts.length === 0 ? (
        <p className="text-sm text-[var(--muted)]">No contacts yet. Import a CSV to get started.</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[var(--muted)]">
              <th className="py-2">Name</th>
              <th className="py-2">Phone</th>
              <th className="py-2">Opt-in</th>
              <th className="py-2">Lead score</th>
            </tr>
          </thead>
          <tbody>
            {contacts.map((c) => (
              <tr key={c.id} className="border-t border-[var(--border)]">
                <td className="py-2">{c.name ?? "—"}</td>
                <td className="py-2">{c.phone}</td>
                <td className="py-2">{c.optInStatus}</td>
                <td className="py-2">{c.leadScore ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
