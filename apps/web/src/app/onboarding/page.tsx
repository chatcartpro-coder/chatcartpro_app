import { VERTICALS } from "@chatcartpro/shared-types";
import { createTenant } from "./actions";

const VERTICAL_LABELS: Record<string, string> = {
  restaurant: "Restaurant",
  salon: "Salon",
  real_estate: "Real Estate",
  gym: "Gym",
  dental_clinic: "Dental Clinic",
  pharmacy: "Pharmacy",
  auto_repair: "Auto Repair",
  event_venue: "Event Venue",
  courier_logistics: "Courier / Logistics",
  grocery_store: "Grocery Store",
  laundry: "Laundry",
  car_rental: "Car Rental",
  hospital_clinic: "Hospital / Clinic",
  other: "Other",
};

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md rounded-2xl bg-[var(--card)] p-8">
        <h1 className="text-xl font-bold">Set up your business</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          This helps us tailor templates, AI replies, and campaign packs to your industry.
        </p>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        <form action={createTenant} className="mt-6 flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Business name</label>
            <input
              name="businessName"
              type="text"
              required
              placeholder="e.g. Acme Dental Clinic"
              className="w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Industry</label>
            <select
              name="vertical"
              defaultValue="other"
              className="w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
            >
              {VERTICALS.map((v) => (
                <option key={v} value={v}>
                  {VERTICAL_LABELS[v]}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white"
          >
            Continue
          </button>
        </form>
      </div>
    </main>
  );
}
