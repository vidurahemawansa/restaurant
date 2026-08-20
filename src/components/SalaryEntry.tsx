"use client";

import { FormEvent, useEffect, useState } from "react";
import { Label, Money } from "@/components/ui";
import { formatLKR, todayInputValue } from "@/lib/utils";
import type { SalaryBalance } from "@/lib/salary";

type Employee = {
  id: string;
  name: string;
  role: string | null;
  salaryType: "DAILY" | "MONTHLY";
  salaryAmount: number;
};

type SalaryEntryProps = {
  employees: Employee[];
  initialEmployeeId?: string;
};

export function SalaryEntry({ employees, initialEmployeeId }: SalaryEntryProps) {
  const [date, setDate] = useState(todayInputValue());
  const [employeeId, setEmployeeId] = useState(
    initialEmployeeId && employees.some((e) => e.id === initialEmployeeId)
      ? initialEmployeeId
      : employees[0]?.id ?? ""
  );
  const [amount, setAmount] = useState("");
  const [paymentType, setPaymentType] = useState<"PAYMENT" | "ADVANCE">("PAYMENT");
  const [notes, setNotes] = useState("");
  const [showMore, setShowMore] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [balance, setBalance] = useState<SalaryBalance | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(false);

  const selected = employees.find((e) => e.id === employeeId);

  useEffect(() => {
    if (!employeeId || !date) return;
    setLoadingBalance(true);
    fetch(`/api/salaries?employeeId=${employeeId}&date=${date}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.balance) setBalance(data.balance);
      })
      .catch(() => setBalance(null))
      .finally(() => setLoadingBalance(false));
  }, [employeeId, date]);

  async function onSave(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/salaries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          employeeId,
          amount: Number(amount),
          type: paymentType,
          notes: showMore ? notes || null : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      setAmount("");
      setNotes("");
      if (data.balance) setBalance(data.balance);

      const emp = data.employee?.name ?? selected?.name ?? "Employee";
      let msg = `Recorded ${formatLKR(data.amount)} for ${emp}`;
      if (data.balance?.salaryType === "DAILY") {
        if (data.balance.remainingForDay > 0) {
          msg += ` · Still owed today: ${formatLKR(data.balance.remainingForDay)}`;
        } else if (data.balance.lendForDay > 0) {
          msg += ` · Lend/advance today: ${formatLKR(data.balance.lendForDay)}`;
        } else {
          msg += " · Fully paid for this day";
        }
      }
      setMessage(msg);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  if (!employees.length) {
    return (
      <p className="text-sm text-[var(--muted)]">
        Add employees first from the{" "}
        <a href="/employees" className="font-semibold text-[var(--accent)]">
          Employees
        </a>{" "}
        page.
      </p>
    );
  }

  return (
    <form onSubmit={onSave} className="space-y-4">
      <div className="panel grid gap-4 sm:grid-cols-2">
        <label className="block">
          <Label>Date</Label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="field w-full"
          />
        </label>
        <label className="block">
          <Label>Employee</Label>
          <select
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            className="field w-full"
          >
            {employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
                {e.role ? ` (${e.role})` : ""} — {formatLKR(e.salaryAmount)}
                {e.salaryType === "DAILY" ? "/day" : "/mo"}
              </option>
            ))}
          </select>
        </label>
      </div>

      {selected && balance && !loadingBalance ? (
        <div className="card grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
          {selected.salaryType === "DAILY" ? (
            <>
              <Stat label="Due today" value={balance.owedForDay} />
              <Stat label="Paid today" value={balance.paidOnDay + balance.advanceOnDay} />
              <Stat label="Remaining today" value={balance.remainingForDay} accent />
              <Stat label="Lend today" value={balance.lendForDay} warn={balance.lendForDay > 0} />
            </>
          ) : null}
          <Stat label="Earned this month" value={balance.earnedThisMonth} />
          <Stat label="Paid this month" value={balance.paidThisMonth + balance.advancesThisMonth} />
          <Stat label="Remaining (month)" value={balance.remainingThisMonth} accent />
          <Stat label="Lend (month)" value={balance.lendThisMonth} warn={balance.lendThisMonth > 0} />
        </div>
      ) : loadingBalance ? (
        <p className="text-sm text-[var(--muted)]">Loading balance…</p>
      ) : null}

      <div className="panel grid gap-4 sm:grid-cols-3">
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
            placeholder={
              selected?.salaryType === "DAILY"
                ? String(selected.salaryAmount)
                : "15000"
            }
          />
        </label>
        <label className="block">
          <Label>Type</Label>
          <select
            value={paymentType}
            onChange={(e) => setPaymentType(e.target.value as "PAYMENT" | "ADVANCE")}
            className="field w-full"
          >
            <option value="PAYMENT">Salary payment</option>
            <option value="ADVANCE">Advance / lend</option>
          </select>
        </label>
        <div className="flex items-end">
          {selected?.salaryType === "DAILY" && balance ? (
            <button
              type="button"
              className="btn-outline w-full"
              onClick={() => setAmount(String(balance.remainingForDay || selected.salaryAmount))}
            >
              Fill remaining ({formatLKR(balance.remainingForDay || selected.salaryAmount)})
            </button>
          ) : null}
        </div>
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
          <Label>Notes</Label>
          <input value={notes} onChange={(e) => setNotes(e.target.value)} className="field w-full" />
        </label>
      ) : null}
      {error ? <p className="alert alert-error">{error}</p> : null}
      {message ? <p className="alert alert-success">{message}</p> : null}
      <button type="submit" disabled={saving} className="btn-primary btn-lg">
        {saving ? "Saving…" : "Save payment"}
      </button>
    </form>
  );
}

function Stat({
  label,
  value,
  accent,
  warn,
}: {
  label: string;
  value: number;
  accent?: boolean;
  warn?: boolean;
}) {
  return (
    <div
      className={`rounded-lg px-3 py-2 ${
        warn && value > 0
          ? "bg-amber-50"
          : accent && value > 0
            ? "bg-[var(--accent-soft)]"
            : "bg-[var(--surface-2)]"
      }`}
    >
      <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--muted)]">
        {label}
      </p>
      <p className="mt-0.5 text-base font-bold">
        <Money amount={value} />
      </p>
    </div>
  );
}
