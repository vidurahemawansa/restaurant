"use client";

import { FormEvent, useState } from "react";
import { Label } from "@/components/ui";
import { EXPENSE_CATEGORIES, formatLKR, todayInputValue } from "@/lib/utils";

export function ExpenseEntry() {
  const [date, setDate] = useState(todayInputValue());
  const [category, setCategory] = useState<string>(EXPENSE_CATEGORIES[0]);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [showMore, setShowMore] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSave(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          category,
          amount: Number(amount),
          description: showMore ? description || null : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      setAmount("");
      setDescription("");
      setMessage(`Saved — ${formatLKR(data.amount)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSave} className="space-y-4">
      <div className="panel grid gap-4 sm:grid-cols-3">
        <label className="block">
          <Label>Date</Label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="field w-full" />
        </label>
        <label className="block">
          <Label>Category</Label>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="field w-full">
            {EXPENSE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <Label>Amount (Rs.)</Label>
          <input
            type="number"
            inputMode="decimal"
            min="0"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="field field-lg w-full"
            placeholder="5000"
          />
        </label>
      </div>
      <button
        type="button"
        onClick={() => setShowMore((v) => !v)}
        className="text-sm font-medium text-[var(--accent)] hover:underline"
      >
        {showMore ? "Hide optional details" : "Optional details →"}
      </button>
      {showMore ? (
        <label className="block">
          <Label>Description</Label>
          <input value={description} onChange={(e) => setDescription(e.target.value)} className="field w-full" />
        </label>
      ) : null}
      {error ? <p className="alert alert-error">{error}</p> : null}
      {message ? <p className="alert alert-success">{message}</p> : null}
      <button type="submit" disabled={saving} className="btn-primary btn-lg">
        {saving ? "Saving…" : "Save expense"}
      </button>
    </form>
  );
}
