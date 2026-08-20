import { ExpenseEntry } from "@/components/ExpenseEntry";
import { PageHeader, RecentList, SectionHeader } from "@/components/ui";
import { requireRestaurantAdminPage } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function ExpensesPage() {
  const { restaurantId } = await requireRestaurantAdminPage();
  const recent = await prisma.expense.findMany({
    where: { restaurantId },
    take: 15,
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
  });

  return (
    <div className="space-y-8">
      <PageHeader
        title="Expenses"
        description="Rent, utilities, transport, and other non-food costs"
      />
      <ExpenseEntry />
      <section>
        <SectionHeader title="Recent expenses" />
        <RecentList
          emptyMessage="No expenses recorded yet."
          items={recent.map((e) => ({
            id: e.id,
            date: e.date,
            amount: e.amount,
            detail: `${e.category}${e.description ? ` · ${e.description}` : ""}`,
          }))}
        />
      </section>
    </div>
  );
}
