import { Suspense } from "react";
import { SalaryEntry } from "@/components/SalaryEntry";
import { PageHeader, RecentList, SectionHeader } from "@/components/ui";
import { requireRestaurantAdminPage } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ employee?: string }> };

export default async function SalariesPage({ searchParams }: Props) {
  const { restaurantId } = await requireRestaurantAdminPage();
  const { employee: initialEmployeeId } = await searchParams;

  const [employees, payments] = await Promise.all([
    prisma.employee.findMany({
      where: { restaurantId, active: true },
      orderBy: { name: "asc" },
    }),
    prisma.salaryPayment.findMany({
      where: { restaurantId },
      take: 15,
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      include: { employee: true },
    }),
  ]);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Salaries"
        description="Record daily or monthly payments — see remaining or lend"
      />
      <Suspense fallback={null}>
        <SalaryEntry employees={employees} initialEmployeeId={initialEmployeeId} />
      </Suspense>
      <section>
        <SectionHeader title="Recent payments" />
        <RecentList
          emptyMessage="No salary payments recorded yet."
          items={payments.map((p) => ({
            id: p.id,
            date: p.date,
            amount: p.amount,
            detail: `${p.employee.name}${p.type === "ADVANCE" ? " · Advance" : ""}${
              p.notes ? ` · ${p.notes}` : ""
            }`,
          }))}
        />
      </section>
    </div>
  );
}
