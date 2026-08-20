import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { authErrorResponse, requireRestaurantAdmin } from "@/lib/auth";
import { computeSalaryBalance } from "@/lib/salary";
import { parseDateInput } from "@/lib/utils";
import { endOfMonth, startOfMonth } from "@/lib/utils";

export async function GET(request: NextRequest) {
  try {
    const { restaurantId } = await requireRestaurantAdmin();
    const { searchParams } = request.nextUrl;
    const employeeId = searchParams.get("employeeId");
    const dateStr = searchParams.get("date");

    if (employeeId && dateStr) {
      const employee = await prisma.employee.findFirst({
        where: { id: employeeId, restaurantId },
      });
      if (!employee) {
        return NextResponse.json({ error: "Employee not found" }, { status: 404 });
      }
      const refDate = parseDateInput(dateStr);
      const monthStart = startOfMonth(refDate);
      const monthEnd = endOfMonth(refDate);
      const payments = await prisma.salaryPayment.findMany({
        where: {
          employeeId,
          restaurantId,
          date: { gte: monthStart, lte: monthEnd },
        },
      });
      const balance = computeSalaryBalance(employee, payments, refDate);
      return NextResponse.json({ employee, balance });
    }

    const limit = Number(searchParams.get("limit") ?? "30");
    const payments = await prisma.salaryPayment.findMany({
      where: { restaurantId },
      take: limit,
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      include: { employee: true },
    });
    const employees = await prisma.employee.findMany({
      where: { restaurantId, active: true },
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ payments, employees });
  } catch (err) {
    return authErrorResponse(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, restaurantId } = await requireRestaurantAdmin();
    const body = await request.json();
    const amount = Number(body.amount);
    if (!body.employeeId || !(amount > 0)) {
      return NextResponse.json({ error: "Employee and amount required" }, { status: 400 });
    }

    const employee = await prisma.employee.findFirst({
      where: { id: body.employeeId, restaurantId },
    });
    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    const payment = await prisma.salaryPayment.create({
      data: {
        restaurantId,
        employeeId: body.employeeId,
        createdById: user.id,
        date: parseDateInput(body.date ?? new Date().toISOString().slice(0, 10)),
        amount,
        type: body.type === "ADVANCE" ? "ADVANCE" : "PAYMENT",
        notes: body.notes || null,
      },
      include: { employee: true },
    });

    const refDate = payment.date;
    const monthStart = startOfMonth(refDate);
    const monthEnd = endOfMonth(refDate);
    const payments = await prisma.salaryPayment.findMany({
      where: {
        employeeId: employee.id,
        restaurantId,
        date: { gte: monthStart, lte: monthEnd },
      },
    });
    const balance = computeSalaryBalance(employee, payments, refDate);

    return NextResponse.json({ ...payment, balance }, { status: 201 });
  } catch (err) {
    return authErrorResponse(err);
  }
}
