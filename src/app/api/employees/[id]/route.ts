import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { authErrorResponse, requireRestaurantAdmin } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { restaurantId } = await requireRestaurantAdmin();
    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.employee.findFirst({
      where: { id, restaurantId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    const data: Record<string, unknown> = {};
    if (body.name != null) {
      const name = String(body.name).trim();
      if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });
      data.name = name;
    }
    if (body.phone !== undefined) data.phone = body.phone?.trim() || null;
    if (body.position !== undefined) data.position = body.position?.trim() || null;
    if (body.role !== undefined) data.role = body.role?.trim() || null;
    if (body.active !== undefined) data.active = Boolean(body.active);
    if (body.salaryType != null) {
      data.salaryType = body.salaryType === "DAILY" ? "DAILY" : "MONTHLY";
    }
    if (body.salaryAmount != null) {
      const salaryAmount = Number(body.salaryAmount);
      if (!(salaryAmount > 0)) {
        return NextResponse.json({ error: "Salary amount must be greater than zero" }, { status: 400 });
      }
      data.salaryAmount = salaryAmount;
    }

    const employee = await prisma.employee.update({
      where: { id },
      data,
    });

    return NextResponse.json({ employee });
  } catch (err) {
    return authErrorResponse(err);
  }
}
