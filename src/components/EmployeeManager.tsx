"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { Label, Money } from "@/components/ui";
import { formatLKR } from "@/lib/utils";
import type { SalaryBalance } from "@/lib/salary";

type Employee = {
  id: string;
  name: string;
  phone: string | null;
  position: string | null;
  role: string | null;
  salaryType: "DAILY" | "MONTHLY";
  salaryAmount: number;
  active: boolean;
  balance?: SalaryBalance;
};

export function EmployeeManager({ initialEmployees }: { initialEmployees: Employee[] }) {
  const [employees, setEmployees] = useState(initialEmployees);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [position, setPosition] = useState("");
  const [salaryType, setSalaryType] = useState<"DAILY" | "MONTHLY">("DAILY");
  const [salaryAmount, setSalaryAmount] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    const res = await fetch("/api/employees");
    const data = await res.json();
    if (res.ok) setEmployees(data.employees);
  }

  async function onAdd(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone: phone || null,
          position: position || null,
          salaryType,
          salaryAmount: Number(salaryAmount),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add employee");
      setName("");
      setPhone("");
      setPosition("");
      setSalaryAmount("");
      setShowForm(false);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add employee");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(employee: Employee) {
    await fetch(`/api/employees/${employee.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !employee.active }),
    });
    await refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-[var(--muted)]">
          {employees.length} active employee{employees.length === 1 ? "" : "s"}
        </p>
        <button type="button" onClick={() => setShowForm((v) => !v)} className="btn-primary">
          {showForm ? "Cancel" : "Add employee"}
        </button>
      </div>

      {showForm ? (
        <form onSubmit={onAdd} className="card space-y-4 p-6">
          <h2 className="text-base font-semibold">New employee</h2>
          <label className="block">
            <Label>Name *</Label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="field field-lg w-full"
              placeholder="Sarath"
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <Label>Phone</Label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="field w-full"
              />
            </label>
            <label className="block">
              <Label>Position</Label>
              <input
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                className="field w-full"
                placeholder="Cook, helper…"
              />
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <Label>Pay type</Label>
              <select
                value={salaryType}
                onChange={(e) => setSalaryType(e.target.value as "DAILY" | "MONTHLY")}
                className="field w-full"
              >
                <option value="DAILY">Daily</option>
                <option value="MONTHLY">Monthly</option>
              </select>
            </label>
            <label className="block">
              <Label>{salaryType === "DAILY" ? "Daily rate (Rs.)" : "Monthly salary (Rs.)"}</Label>
              <input
                type="number"
                min="1"
                required
                value={salaryAmount}
                onChange={(e) => setSalaryAmount(e.target.value)}
                className="field field-lg w-full"
                placeholder={salaryType === "DAILY" ? "4500" : "45000"}
              />
            </label>
          </div>
          {error ? <p className="alert alert-error">{error}</p> : null}
          <button type="submit" disabled={saving} className="btn-primary btn-lg">
            {saving ? "Saving…" : "Save employee"}
          </button>
        </form>
      ) : null}

      <ul className="space-y-3">
        {employees.map((employee) => (
          <li key={employee.id} className="card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{employee.name}</p>
                <p className="text-sm text-[var(--muted)]">
                  {employee.position || employee.role || "Staff"}
                  {employee.phone ? ` · ${employee.phone}` : ""}
                </p>
                <p className="mt-1 text-sm font-medium text-[var(--accent)]">
                  {formatLKR(employee.salaryAmount)}
                  {employee.salaryType === "DAILY" ? " / day" : " / month"}
                </p>
              </div>
              <div className="flex gap-2">
                <Link href={`/salaries?employee=${employee.id}`} className="btn-outline btn-sm">
                  Pay salary
                </Link>
                <button
                  type="button"
                  onClick={() => toggleActive(employee)}
                  className="btn-ghost btn-sm text-xs"
                >
                  {employee.active ? "Deactivate" : "Activate"}
                </button>
              </div>
            </div>
            {employee.balance ? (
              <div className="mt-4 grid grid-cols-2 gap-2 border-t border-[var(--line-soft)] pt-4 sm:grid-cols-4">
                <BalanceChip label="Earned (month)" amount={employee.balance.earnedThisMonth} />
                <BalanceChip label="Paid (month)" amount={employee.balance.paidThisMonth} />
                <BalanceChip
                  label="Remaining"
                  amount={employee.balance.remainingThisMonth}
                  highlight={employee.balance.remainingThisMonth > 0}
                />
                <BalanceChip
                  label="Lend / advance"
                  amount={employee.balance.lendThisMonth}
                  highlight={employee.balance.lendThisMonth > 0}
                  warn
                />
              </div>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

function BalanceChip({
  label,
  amount,
  highlight,
  warn,
}: {
  label: string;
  amount: number;
  highlight?: boolean;
  warn?: boolean;
}) {
  return (
    <div
      className={`rounded-lg px-3 py-2 ${
        highlight
          ? warn
            ? "bg-amber-50 text-amber-900"
            : "bg-[var(--accent-soft)]"
          : "bg-[var(--surface-2)]"
      }`}
    >
      <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--muted)]">
        {label}
      </p>
      <p className="mt-0.5 text-sm font-bold tabular-nums">
        <Money amount={amount} />
      </p>
    </div>
  );
}
