import { prisma } from "@chatcartpro/db";
import { getCurrentSession } from "@/lib/auth/get-current-tenant";

export default async function InboxPage() {
  const session = await getCurrentSession();
  const tenantId = session!.user!.tenantId;
  const conversations = await prisma.conversation.findMany({
    where: { tenantId },
    take: 50,
    orderBy: { updatedAt: "desc" },
    include: { contact: true, messages: { take: 1, orderBy: { createdAt: "desc" } } },
  });

  return (
    <div className="rounded-2xl bg-[var(--card)] p-5">
      <h1 className="text-xl font-bold mb-4">Inbox</h1>
      {conversations.length === 0 ? (
        <p className="text-sm text-[var(--muted)]">No conversations yet.</p>
      ) : (
        <ul className="divide-y divide-[var(--border)]">
          {conversations.map((c) => (
            <li key={c.id} className="py-3">
              <div className="font-medium">{c.contact.name ?? c.contact.phone}</div>
              <div className="text-sm text-[var(--muted)] truncate">
                {c.messages[0]?.body ?? "No messages"}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
