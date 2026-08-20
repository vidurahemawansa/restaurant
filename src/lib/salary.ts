import type { SalaryType } from "@/generated/prisma/client";
import { endOfDay, endOfMonth, startOfDay, startOfMonth } from "@/lib/utils";

type PaymentRow = {
  date: Date;
  amount: number;
  type: string;
};

export type SalaryBalance = {
  salaryType: SalaryType;
  salaryAmount: number;
  rateLabel: string;
  owedForDay: number;
  paidOnDay: number;
  advanceOnDay: number;
  remainingForDay: number;
  lendForDay: number;
  earnedThisMonth: number;
  paidThisMonth: number;
  advancesThisMonth: number;
  remainingThisMonth: number;
  lendThisMonth: number;
};

export function computeSalaryBalance(
  employee: { salaryType: SalaryType; salaryAmount: number },
  payments: PaymentRow[],
  referenceDate: Date = new Date()
): SalaryBalance {
  const monthStart = startOfMonth(referenceDate);
  const monthEnd = endOfMonth(referenceDate);
  const dayStart = startOfDay(referenceDate);
  const dayEnd = endOfDay(referenceDate);

  const monthPayments = payments.filter((p) => p.date >= monthStart && p.date <= monthEnd);
  const dayPayments = payments.filter((p) => p.date >= dayStart && p.date <= dayEnd);

  const paidOnDay = dayPayments
    .filter((p) => p.type === "PAYMENT")
    .reduce((s, p) => s + p.amount, 0);
  const advanceOnDay = dayPayments
    .filter((p) => p.type === "ADVANCE")
    .reduce((s, p) => s + p.amount, 0);
  const totalOnDay = paidOnDay + advanceOnDay;

  const paidThisMonth = monthPayments
    .filter((p) => p.type === "PAYMENT")
    .reduce((s, p) => s + p.amount, 0);
  const advancesThisMonth = monthPayments
    .filter((p) => p.type === "ADVANCE")
    .reduce((s, p) => s + p.amount, 0);
  const totalPaidMonth = paidThisMonth + advancesThisMonth;

  const owedForDay = employee.salaryType === "DAILY" ? employee.salaryAmount : 0;

  let earnedThisMonth: number;
  if (employee.salaryType === "MONTHLY") {
    earnedThisMonth = employee.salaryAmount;
  } else {
    earnedThisMonth = employee.salaryAmount * referenceDate.getDate();
  }

  const remainingForDay = Math.max(0, owedForDay - totalOnDay);
  const lendForDay = employee.salaryType === "DAILY" ? Math.max(0, totalOnDay - owedForDay) : 0;

  const remainingThisMonth = Math.max(0, earnedThisMonth - totalPaidMonth);
  const lendThisMonth = Math.max(0, totalPaidMonth - earnedThisMonth);

  const rateLabel =
    employee.salaryType === "DAILY"
      ? `${employee.salaryAmount.toLocaleString("en-LK")}/day`
      : `${employee.salaryAmount.toLocaleString("en-LK")}/month`;

  return {
    salaryType: employee.salaryType,
    salaryAmount: employee.salaryAmount,
    rateLabel,
    owedForDay,
    paidOnDay,
    advanceOnDay,
    remainingForDay,
    lendForDay,
    earnedThisMonth,
    paidThisMonth,
    advancesThisMonth,
    remainingThisMonth,
    lendThisMonth,
  };
}

export async function getEmployeeSalarySummary(
  employeeId: string,
  now = new Date()
) {
  const { prisma } = await import("@/lib/db");
  const employee = await prisma.employee.findUniqueOrThrow({
    where: { id: employeeId },
  });

  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const payments = await prisma.salaryPayment.findMany({
    where: {
      employeeId,
      date: { gte: monthStart, lte: monthEnd },
    },
    orderBy: { date: "desc" },
  });

  const balance = computeSalaryBalance(employee, payments, now);

  return {
    employeeName: employee.name,
    salaryType: employee.salaryType,
    salaryAmount: employee.salaryAmount,
    rateLabel: balance.rateLabel,
    earnedThisMonth: balance.earnedThisMonth,
    received: balance.paidThisMonth,
    advances: balance.advancesThisMonth,
    remaining: balance.remainingThisMonth,
    lend: balance.lendThisMonth,
    payments: payments.map((p) => ({
      id: p.id,
      date: p.date,
      amount: p.amount,
      type: p.type,
      notes: p.notes,
    })),
  };
}
