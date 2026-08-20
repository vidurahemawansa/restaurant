import { NextRequest, NextResponse } from "next/server";
import { createSale, SaleValidationError } from "@/lib/sales";
import { TOTAL_MISMATCH_TOLERANCE } from "@/lib/bills/constants";
import { authErrorResponse, requireRestaurantAdmin } from "@/lib/auth";
import { parseDateInput } from "@/lib/utils";

type TransactionLine = {
  menuItemId: string;
  quantity: number;
  unitPrice: number;
};

export async function POST(request: NextRequest) {
  try {
    const { user, restaurantId } = await requireRestaurantAdmin();
    const body = await request.json();
    const lines: TransactionLine[] = body.lines ?? [];

    if (!lines.length) {
      return NextResponse.json({ error: "At least one line item is required" }, { status: 400 });
    }

    const calculatedTotal = lines.reduce(
      (sum, l) => sum + Math.round(Number(l.quantity)) * Number(l.unitPrice),
      0
    );
    const discount = Number(body.discount ?? 0);
    const expectedTotal = calculatedTotal - discount;
    const handwrittenTotal =
      body.handwrittenTotal != null ? Number(body.handwrittenTotal) : null;

    const totalMismatch =
      handwrittenTotal != null &&
      Math.abs(handwrittenTotal - expectedTotal) > TOTAL_MISMATCH_TOLERANCE;

    if (totalMismatch && !body.confirmTotalMismatch) {
      return NextResponse.json(
        {
          error: "Total mismatch",
          message:
            "The handwritten total doesn't match the calculated total. Please verify before saving.",
          calculatedTotal: expectedTotal,
          handwrittenTotal,
          requiresConfirmation: true,
        },
        { status: 409 }
      );
    }

    const notesParts = ["Source: handwritten bill scan"];
    if (handwrittenTotal != null && totalMismatch) {
      notesParts.push(`Handwritten total: ${handwrittenTotal}`);
    }
    if (body.notes) notesParts.push(String(body.notes));

    const sale = await createSale({
      restaurantId,
      createdById: user.id,
      date: body.date ?? parseDateInput(new Date().toISOString().slice(0, 10)),
      lines: lines.map((l) => ({
        menuItemId: l.menuItemId,
        quantity: Number(l.quantity),
        unitPrice: Number(l.unitPrice),
      })),
      notes: notesParts.join(" · "),
    });

    return NextResponse.json(sale, { status: 201 });
  } catch (err) {
    if (err instanceof SaleValidationError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    return authErrorResponse(err);
  }
}
