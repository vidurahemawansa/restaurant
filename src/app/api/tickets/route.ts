import { NextResponse } from "next/server";
import { authErrorResponse, requireRestaurantAdmin } from "@/lib/auth";
import { formatTicketItemSummary } from "@/lib/menu-display-name";
import { groupTickets, listTickets } from "@/lib/tickets";

export async function GET() {
  try {
    const { restaurantId } = await requireRestaurantAdmin();
    const tickets = await listTickets(restaurantId);
    const payload = tickets.map((ticket) => ({
      ...ticket,
      itemSummary: formatTicketItemSummary(ticket.lines),
    }));
    return NextResponse.json({
      tickets: payload,
      groups: groupTickets(payload),
    });
  } catch (err) {
    return authErrorResponse(err);
  }
}
