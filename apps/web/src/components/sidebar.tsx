import Link from "next/link";
import { logout } from "@/app/dashboard/actions";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard/contacts", label: "Contacts" },
  { href: "/dashboard/templates", label: "Templates" },
  { href: "/dashboard/campaigns", label: "Campaigns" },
  { href: "/dashboard/inbox", label: "Inbox" },
];

export function Sidebar({ tenantName }: { tenantName?: string }) {
  return (
    <aside className="w-60 shrink-0 rounded-2xl bg-[var(--card)] p-6 flex flex-col">
      <div className="flex items-center gap-2 pb-1 font-bold text-lg">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--lime)]">
          CC
        </span>
        ChatCart Pro
      </div>
      {tenantName && (
        <div className="pb-5 pl-1 text-xs text-[var(--muted)] truncate">{tenantName}</div>
      )}
      <nav className="flex flex-col gap-1">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-lg px-3 py-2 text-sm font-medium text-[var(--muted)] hover:bg-[#f2ffcc] hover:text-[var(--accent)]"
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <form action={logout} className="mt-auto">
        <button
          type="submit"
          className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-[var(--muted)] hover:bg-[#f2ffcc] hover:text-[var(--accent)]"
        >
          Log out
        </button>
      </form>
    </aside>
  );
}
