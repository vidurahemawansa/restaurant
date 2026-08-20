import { EmployeeManager } from "@/components/EmployeeManager";
import { PageHeader } from "@/components/ui";
import { requireRestaurantAdminPage } from "@/lib/auth";
import { computeSalaryBalance } from "@/lib/salary";
import { prisma } from "@/lib/db";
import { endOfMonth, startOfMonth } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function EmployeesPage() {
  const { restaurantId } = await requireRestaurantAdminPage();

  const employees = await prisma.employee.findMany({
    where: { restaurantId, active: true },
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

  const enriched = employees.map((employee) => ({
    ...employee,
    balance: computeSalaryBalance(
      employee,
      allPayments.filter((p) => p.employeeId === employee.id)
    ),
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Employees"
        description="Add staff, set daily or monthly pay, track balances"
      />
      <EmployeeManager initialEmployees={enriched} />
    </div>
  );
}
