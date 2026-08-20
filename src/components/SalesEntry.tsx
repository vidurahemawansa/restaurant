"use client";

import { FormEvent, useMemo, useState } from "react";
import { Label } from "@/components/ui";
import { formatLKR, todayInputValue } from "@/lib/utils";

type MenuItem = {
  id: string;
  name: string;
  price: number;
  category: string | null;
};

export function SalesEntry({ menuItems }: { menuItems: MenuItem[] }) {
  const [date, setDate] = useState(todayInputValue());
  const [qty, setQty] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const lines = useMemo(() => {
    return menuItems
      .map((item) => {
        const quantity = Number(qty[item.id] || 0);
        if (!quantity) return null;
        return {
          menuItemId: item.id,
          name: item.name,
          quantity,
          unitPrice: item.price,
          amount: quantity * item.price,
        };
      })
      .filter(Boolean) as {
      menuItemId: string;
      name: string;
      quantity: number;
      unitPrice: number;
      amount: number;
    }[];
  }, [menuItems, qty]);

  const total = lines.reduce((sum, l) => sum + l.amount, 0);

  async function onSave(e: FormEvent) {
    e.preventDefault();
    if (!lines.length) {
      setError("Enter at least one quantity");
      return;
    }
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          lines: lines.map((l) => ({
            menuItemId: l.menuItemId,
            quantity: l.quantity,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      setQty({});
      setMessage(`Saved — ${formatLKR(data.totalAmount)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSave} className="space-y-6">
      <div className="panel">
        <label className="block">
          <Label>Date</Label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="field"
          />
        </label>
      </div>

      <div className="card overflow-hidden">
        <div className="hidden border-b border-[var(--line-soft)] bg-[var(--surface-2)] px-5 py-2.5 text-xs font-semibold uppercase tracking-wide text-[var(--muted)] sm:grid sm:grid-cols-[1fr_5rem_5rem_5rem] sm:gap-3">
          <span>Item</span>
          <span className="text-center">Qty</span>
          <span className="text-right">Price</span>
          <span className="text-right">Total</span>
        </div>
        <ul className="divide-y divide-[var(--line-soft)]">
          {menuItems.map((item) => {
            const q = Number(qty[item.id] || 0);
            const lineTotal = q * item.price;
            const active = q > 0;
            return (
              <li
                key={item.id}
                className={`grid grid-cols-[1fr_5.5rem_5rem] items-center gap-3 px-4 py-3.5 sm:grid-cols-[1fr_5rem_5rem_5rem] sm:px-5 ${
                  active ? "bg-[var(--accent-soft)]/40" : ""
                }`}
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{item.name}</p>
                  <p className="text-xs text-[var(--muted)]">{formatLKR(item.price)}</p>
                </div>
                <label className="block">
                  <span className="sr-only">Quantity</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    min="0"
                    step="1"
                    placeholder="0"
                    value={qty[item.id] ?? ""}
                    onChange={(e) =>
                      setQty((prev) => ({ ...prev, [item.id]: e.target.value }))
                    }
                    className="field field-lg w-full text-center"
                  />
                </label>
                <p className="hidden text-right text-sm text-[var(--muted)] sm:block">
                  {formatLKR(item.price)}
                </p>
                <p
                  className={`text-right text-sm font-semibold tabular-nums ${
                    active ? "text-[var(--accent)]" : "text-[var(--muted-light)]"
                  }`}
                >
                  {active ? formatLKR(lineTotal) : "—"}
                </p>
              </li>
            );
          })}
        </ul>
        <div className="flex items-center justify-between border-t border-[var(--line-soft)] bg-[var(--surface-2)] px-5 py-4">
          <span className="section-title">Revenue</span>
          <span className="text-xl font-bold tabular-nums">{formatLKR(total)}</span>
        </div>
      </div>

      {error ? <p className="alert alert-error">{error}</p> : null}
      {message ? <p className="alert alert-success">{message}</p> : null}

      <button
        type="submit"
        disabled={saving || lines.length === 0}
        className="btn-primary btn-lg w-full sm:w-auto"
      >
        {saving ? "Saving…" : `Save — ${formatLKR(total)}`}
      </button>
    </form>
  );
}
