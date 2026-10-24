import { formatTicketItemSummary } from "@/lib/menu-display-name";
import { TICKET_STATUS, type TicketWithLines } from "@/lib/tickets";
import { formatLKR } from "@/lib/utils";

export function TicketCard({ ticket }: { ticket: TicketWithLines }) {
  const itemCount = ticket.lines.reduce((sum, line) => sum + line.quantity, 0);
  const summary = formatTicketItemSummary(ticket.lines);
  const open = ticket.status === TICKET_STATUS.OPEN;

  return (
    <article className="card p-4 sm:px-5">
      <div className="flex items-start justify-between gap-3">
        <p className="font-semibold tracking-tight">
          #{ticket.ticketNumber} · {ticket.orderType}
        </p>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${
            open
              ? "bg-[var(--accent-soft)] text-[var(--accent)]"
              : "bg-[var(--surface-2)] text-[var(--muted)]"
          }`}
        >
          {open ? "Open" : "Closed"}
        </span>
      </div>
      {summary ? (
        <p className="mt-1.5 truncate text-sm text-[var(--ink)]" title={summary}>
          {summary}
        </p>
      ) : (
        <p className="mt-1.5 truncate text-sm text-[var(--muted)]">No items</p>
      )}
      <p className="mt-1 text-sm text-[var(--muted)]">
        {itemCount} {itemCount === 1 ? "item" : "items"} · {formatLKR(ticket.totalAmount)}
      </p>
    </article>
  );
}
