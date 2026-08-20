"use client";

import { useEffect, useState } from "react";
import { formatLKR, todayInputValue } from "@/lib/utils";

type Item = { id: string; name: string };
type Point = {
  label: string;
  amount: number;
  quantity: number | null;
  averagePrice: number | null;
};

export function CostTrendClient({ items }: { items: Item[] }) {
  const defaultItem =
    items.find((i) => i.name === "Chicken")?.id ??
    items.find((i) => i.name === "Rice")?.id ??
    items[0]?.id ??
    "";

  const [itemId, setItemId] = useState(defaultItem);
  const [granularity, setGranularity] = useState<"daily" | "weekly" | "monthly">("monthly");
  const [from, setFrom] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 5);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
  });
  const [to, setTo] = useState(todayInputValue());
  const [points, setPoints] = useState<Point[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!itemId) return;
    let cancelled = false;
    setLoading(true);
    fetch(
      `/api/reports?type=trend&itemId=${itemId}&granularity=${granularity}&from=${from}&to=${to}`
    )
      .then((r) => r.json())
      .then((json) => {
        if (!cancelled) setPoints(json.points ?? []);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [itemId, granularity, from, to]);

  const max = points.reduce((m, p) => Math.max(m, p.amount), 0);
  const selectedName = items.find((i) => i.id === itemId)?.name ?? "Item";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3">
        <label className="block">
          <span className="mb-1 block text-xs text-[var(--muted)]">Item</span>
          <select value={itemId} onChange={(e) => setItemId(e.target.value)} className="field">
            {items.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs text-[var(--muted)]">View</span>
          <select
            value={granularity}
            onChange={(e) => setGranularity(e.target.value as typeof granularity)}
            className="field"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs text-[var(--muted)]">From</span>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="field" />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs text-[var(--muted)]">To</span>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="field" />
        </label>
      </div>

      <h2 className="font-[family-name:var(--font-display)] text-xl">{selectedName} spending</h2>

      {loading ? (
        <p className="text-sm text-[var(--muted)]">Loading…</p>
      ) : points.length === 0 ? (
        <p className="text-sm text-[var(--muted)]">No purchases for this item in the selected range.</p>
      ) : (
        <ul className="space-y-4">
          {points.map((p) => {
            const width = max === 0 ? 0 : Math.round((p.amount / max) * 100);
            return (
              <li key={p.label} className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4">
                <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
                  <span className="font-medium">{p.label}</span>
                  <span className="tabular-nums font-semibold">{formatLKR(p.amount)}</span>
                </div>
                <div className="mb-2 h-2.5 overflow-hidden rounded-full bg-[var(--surface-2)]">
                  <div
                    className="h-full rounded-full bg-[var(--accent)] transition-[width] duration-500"
                    style={{ width: `${width}%` }}
                  />
                </div>
                {p.averagePrice != null ? (
                  <p className="text-xs text-[var(--muted)]">
                    Qty {p.quantity} · avg {formatLKR(p.averagePrice)}
                  </p>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
