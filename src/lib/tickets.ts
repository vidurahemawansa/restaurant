import { prisma } from "@/lib/db";
import { startOfDay } from "@/lib/utils";

export const TICKET_STATUS = {
  OPEN: "OPEN",
  CLOSED: "CLOSED",
} as const;

export type TicketStatus = (typeof TICKET_STATUS)[keyof typeof TICKET_STATUS];

export const ticketInclude = {
  lines: { include: { menuItem: true }, orderBy: { id: "asc" as const } },
};

export type TicketWithLines = Awaited<ReturnType<typeof listTickets>>[number];

export async function nextTicketNumber(restaurantId: string) {
  const last = await prisma.sale.findFirst({
    where: { restaurantId },
    orderBy: { ticketNumber: "desc" },
    select: { ticketNumber: true },
  });
  return (last?.ticketNumber ?? 0) + 1;
}

export async function listTickets(restaurantId: string) {
  return prisma.sale.findMany({
    where: { restaurantId },
    orderBy: [{ createdAt: "desc" }, { ticketNumber: "desc" }],
    include: ticketInclude,
  });
}

export function groupTickets<T extends { status: string; closedAt: Date | null; date: Date }>(
  tickets: T[]
) {
  const todayStart = startOfDay();
  const yesterdayStart = startOfDay(new Date(todayStart.getTime() - 24 * 60 * 60 * 1000));
  const weekStart = startOfDay(new Date(todayStart.getTime() - 7 * 24 * 60 * 60 * 1000));

  const groups = {
    openNow: [] as T[],
    todayClosed: [] as T[],
    yesterday: [] as T[],
    past7: [] as T[],
    older: [] as T[],
  };

  for (const ticket of tickets) {
    if (ticket.status === TICKET_STATUS.OPEN) {
      groups.openNow.push(ticket);
      continue;
    }
    const when = ticket.closedAt ?? ticket.date;
    const t = when instanceof Date ? when : new Date(when);
    if (t >= todayStart) groups.todayClosed.push(ticket);
    else if (t >= yesterdayStart) groups.yesterday.push(ticket);
    else if (t >= weekStart) groups.past7.push(ticket);
    else groups.older.push(ticket);
  }

  return groups;
}
