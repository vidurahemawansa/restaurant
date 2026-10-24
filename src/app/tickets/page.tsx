import { TicketCard } from "@/components/TicketCard";
import { PageHeader } from "@/components/ui";
import { requireRestaurantAdminPage } from "@/lib/auth";
import { groupTickets, listTickets } from "@/lib/tickets";

export const dynamic = "force-dynamic";

const GROUPS = [
  { key: "openNow", title: "Open now" },
  { key: "todayClosed", title: "Today Closed" },
  { key: "yesterday", title: "Yesterday" },
  { key: "past7", title: "Past 7 days" },
  { key: "older", title: "Older" },
] as const;

export default async function TicketsPage() {
  const { restaurantId } = await requireRestaurantAdminPage();
  const tickets = await listTickets(restaurantId);
  const grouped = groupTickets(tickets);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Tickets"
        description="Open and closed orders — items shown so you can close the right ticket"
      />

      {GROUPS.map(({ key, title }) => {
        const items = grouped[key];
        return (
          <section key={key}>
            <div className="mb-3 flex items-baseline justify-between gap-3">
              <h2 className="text-base font-semibold text-[var(--ink)]">{title}</h2>
              <span className="text-xs font-medium text-[var(--muted)]">{items.length}</span>
            </div>
            {items.length ? (
              <ul className="space-y-3">
                {items.map((ticket) => (
                  <li key={ticket.id}>
                    <TicketCard ticket={ticket} />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="card px-4 py-8 text-center text-sm text-[var(--muted)]">
                No tickets in this group.
              </p>
            )}
          </section>
        );
      })}
    </div>
  );
}
