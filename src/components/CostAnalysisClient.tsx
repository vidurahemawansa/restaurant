"use client";

import { useEffect, useState } from "react";
import { formatLKR, startOfMonth, todayInputValue } from "@/lib/utils";

type Analysis = {
  grandTotal: number;
  byItem: {
    itemId: string;
    name: string;
    category: string;
    totalAmount: number;
    percentOfTotal: number;
    purchaseCount: number;
    quantity: number | null;
    averageAmount: number;
  }[];
  byCategory: {
    category: string;
    totalAmount: number;
    percentOfTotal: number;
    purchaseCount: number;
  }[];
};

function monthStartValue() {
  const d = startOfMonth(new Date());
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

export function CostAnalysisClient() {
  const [from, setFrom] = useState(monthStartValue());
  const [to, setTo] = useState(todayInputValue());
  const [data, setData] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/reports?type=major&from=${from}&to=${to}`)
      .then((r) => r.json())
      .then((json) => {
        if (!cancelled) setData(json);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [from, to]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3">
        <label className="block">
          <span className="mb-1 block text-xs text-[var(--muted)]">From</span>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="field" />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs text-[var(--muted)]">To</span>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="field" />
        </label>
      </div>

      {loading ? (
        <p className="text-sm text-[var(--muted)]">Loading…</p>
      ) : !data ? (
        <p className="text-sm text-[var(--danger)]">Failed to load</p>
      ) : (
        <>
          <p className="font-[family-name:var(--font-display)] text-2xl">
            Total purchases: {formatLKR(data.grandTotal)}
          </p>

          <section>
            <h2 className="mb-3 font-[family-name:var(--font-display)] text-lg">
              Spending by item
            </h2>
            {data.byItem.length === 0 ? (
              <p className="text-sm text-[var(--muted)]">No purchases in this range.</p>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-[var(--line)] bg-[var(--surface)]">
                <table className="min-w-full text-sm">
                  <thead className="bg-[var(--surface-2)] text-left text-xs uppercase tracking-wide text-[var(--muted)]">
                    <tr>
                      <th className="px-4 py-3">Item</th>
                      <th className="px-4 py-3">Category</th>
                      <th className="px-4 py-3 text-right">Amount</th>
                      <th className="px-4 py-3 text-right">%</th>
                      <th className="px-4 py-3 text-right"># Purchases</th>
                      <th className="px-4 py-3 text-right">Qty</th>
                      <th className="px-4 py-3 text-right">Avg</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--line)]">
                    {data.byItem.map((row) => (
                      <tr key={row.itemId}>
                        <td className="px-4 py-3 font-medium">{row.name}</td>
                        <td className="px-4 py-3 text-[var(--muted)]">{row.category}</td>
                        <td className="px-4 py-3 text-right tabular-nums">{formatLKR(row.totalAmount)}</td>
                        <td className="px-4 py-3 text-right tabular-nums">{row.percentOfTotal}%</td>
                        <td className="px-4 py-3 text-right tabular-nums">{row.purchaseCount}</td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          {row.quantity != null ? row.quantity : "—"}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          {formatLKR(row.averageAmount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section>
            <h2 className="mb-3 font-[family-name:var(--font-display)] text-lg">
              Major cost categories
            </h2>
            <ul className="space-y-3">
              {data.byCategory.map((cat, i) => {
                const max = data.byCategory[0]?.totalAmount ?? 0;
                const width = max === 0 ? 0 : Math.round((cat.totalAmount / max) * 100);
                const colors = [
                  "var(--chart-1)",
                  "var(--chart-2)",
                  "var(--chart-3)",
                  "var(--chart-4)",
                  "var(--chart-5)",
                ];
                return (
                  <li key={cat.category} className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4">
                    <div className="mb-2 flex justify-between gap-3 text-sm">
                      <span className="font-medium">{cat.category}</span>
                      <span className="tabular-nums text-[var(--muted)]">
                        {formatLKR(cat.totalAmount)} · {cat.percentOfTotal}% · {cat.purchaseCount} purchases
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-[var(--surface-2)]">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${width}%`, background: colors[i % colors.length] }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}
