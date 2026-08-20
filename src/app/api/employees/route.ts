import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { authErrorResponse, requireRestaurantAdmin } from "@/lib/auth";
import { computeSalaryBalance } from "@/lib/salary";
import { endOfMonth, startOfMonth } from "@/lib/utils";
import type { SalaryType } from "@/generated/prisma/client";

export async function GET(request: NextRequest) {
  try {
    const { restaurantId } = await requireRestaurantAdmin();
    const includeInactive = request.nextUrl.searchParams.get("all") === "1";

    const employees = await prisma.employee.findMany({
      where: { restaurantId, ...(includeInactive ? {} : { active: true }) },
      orderBy: { name: "asc" },
    });

    const monthStart = startOfMonth();
    const monthEnd = endOfMonth();

    const allPayments = await prisma.salaryPayment.findMany({
      where: {
        restaurantId,
        employeeId: { in: employees.map((e) => e.id) },
        date: { gte: monthStart, lte: monthEnd },
      },
    });

    const enriched = employees.map((employee) => {
      const payments = allPayments.filter((p) => p.employeeId === employee.id);
      const balance = computeSalaryBalance(employee, payments);
      return { ...employee, balance };
    });

    return NextResponse.json({ employees: enriched });
  } catch (err) {
    return authErrorResponse(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { restaurantId } = await requireRestaurantAdmin();
    const body = await request.json();

    const name = String(body.name ?? "").trim();
    if (!name) {
      return NextResponse.json({ error: "Employee name is required" }, { status: 400 });
    }

    const salaryType = (body.salaryType === "DAILY" ? "DAILY" : "MONTHLY") as SalaryType;
    const salaryAmount = Number(body.salaryAmount);
    if (!(salaryAmount > 0)) {
      return NextResponse.json({ error: "Salary amount must be greater than zero" }, { status: 400 });
    }

    const employee = await prisma.employee.create({
      data: {
        restaurantId,
        name,
        phone: body.phone?.trim() || null,
        position: body.position?.trim() || null,
        role: body.role?.trim() || null,
        salaryType,
        salaryAmount,
      },
    });

    return NextResponse.json({ employee }, { status: 201 });
  } catch (err) {
    return authErrorResponse(err);
  }
}
