import Link from "next/link";
import { Money, SectionHeader, StatCard, Card } from "@/components/ui";
import { DateRangeFilter } from "@/components/DateRangeFilter";
import { formatLKR } from "@/lib/utils";
import type { DashboardData } from "@/lib/dashboard";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export function DashboardShell({ data }: { data: DashboardData }) {
  const todaySpend =
    data.today.purchases + data.today.otherExpenses + data.today.salaries;
  const avgOrder = data.billCountToday > 0 ? data.today.sales / data.billCountToday : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">{greeting()} 👋</h1>
        <p className="page-sub">{data.restaurantName}</p>
      </div>

      <DateRangeFilter active="today" />

      {/* Today's summary */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard label="Today's sales" value={<Money amount={data.today.sales} />} accent />
        <StatCard label="Orders" value={data.billCountToday} />
        <div className="hidden sm:block">
          <StatCard
            label="Avg order"
            value={avgOrder > 0 ? formatLKR(avgOrder) : "—"}
          />
        </div>
        <StatCard label="Purchases" value={<Money amount={data.today.purchases} />} />
        <StatCard label="Other expenses" value={<Money amount={data.today.otherExpenses} />} />
        <StatCard label="Salary cost" value={<Money amount={data.today.salaries} />} />
        <StatCard
          label="Est. profit"
          value={<Money amount={data.today.profit} />}
          accent
          hint="Estimated — not exact COGS"
        />
      </div>

      {/* Quick actions */}
      <section>
        <SectionHeader title="Quick actions" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Link href="/tickets" className="card flex flex-col items-center gap-2 p-4 text-center transition hover:border-[var(--accent-muted)]">
            <span className="text-2xl">#</span>
            <span className="text-sm font-semibold">Tickets</span>
          </Link>
          <Link href="/sales" className="card flex flex-col items-center gap-2 p-4 text-center transition hover:border-[var(--accent-muted)]">
            <span className="text-2xl">◎</span>
            <span className="text-sm font-semibold">+ Sale</span>
          </Link>
          <Link href="/purchases" className="card flex flex-col items-center gap-2 p-4 text-center transition hover:border-[var(--accent-muted)]">
            <span className="text-2xl">＋</span>
            <span className="text-sm font-semibold">+ Purchase</span>
          </Link>
          <Link href="/expenses" className="card flex flex-col items-center gap-2 p-4 text-center transition hover:border-[var(--accent-muted)]">
            <span className="text-2xl">₨</span>
            <span className="text-sm font-semibold">+ Expense</span>
          </Link>
          <Link href="/salaries" className="card flex flex-col items-center gap-2 p-4 text-center transition hover:border-[var(--accent-muted)]">
            <span className="text-2xl">👤</span>
            <span className="text-sm font-semibold">+ Salary</span>
          </Link>
        </div>
      </section>

      {/* Phase 5 placeholders */}
      <Card>
        <SectionHeader title="Business performance" />
        <div className="flex h-32 items-center justify-center rounded-xl border border-dashed border-[var(--line)] bg-[var(--surface-2)] text-sm text-[var(--muted)]">
          Sales trend chart — Phase 5
        </div>
      </Card>

      <Card>
        <SectionHeader title="Top products" />
        <p className="text-sm text-[var(--muted)]">Product rankings — Phase 5 analytics</p>
      </Card>

      <Card>
        <SectionHeader title="Cost breakdown" href="/reports/costs" linkLabel="View costs" />
        {data.majorCosts.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">No purchase data yet.</p>
        ) : (
          <ul className="space-y-3">
            {data.majorCosts.slice(0, 5).map((item) => (
              <li key={item.name} className="flex justify-between text-sm">
                <span className="font-medium">{item.name}</span>
                <span className="tabular-nums text-[var(--muted)]">{formatLKR(item.amount)}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <SectionHeader title="Insights" />
        <ul className="space-y-2 text-sm text-[var(--muted)]">
          <li>⚠ Best/worst day analysis — Phase 5</li>
          <li>⚠ Slow-day alerts — Phase 5</li>
          <li>✓ Today&apos;s spend: {formatLKR(todaySpend)}</li>
          <li>✓ {data.employeeCount} active employee{data.employeeCount === 1 ? "" : "s"}</li>
        </ul>
      </Card>

      {/* P&L placeholder */}
      <Card>
        <SectionHeader title="Profit & loss" />
        <div className="grid gap-3 sm:grid-cols-3">
          <StatCard label="Month sales" value={<Money amount={data.month.sales} />} />
          <StatCard label="Month spend" value={<Money amount={data.month.purchases} />} />
          <StatCard label="Month est. profit" value={<Money amount={data.month.profit} />} accent />
        </div>
        <p className="mt-3 text-xs text-[var(--muted)]">
          Full P&amp;L report with COGS — Phase 4
        </p>
      </Card>
    </div>
  );
}
