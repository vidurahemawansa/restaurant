"use client";

import { useEffect, useState } from "react";
import { formatLKR } from "@/lib/utils";

type Payment = { id: string; date: string; amount: number; type: string; notes: string | null };
type SalaryData = {
  employeeName: string;
  salaryType: "DAILY" | "MONTHLY";
  salaryAmount: number;
  rateLabel: string;
  received: number;
  remaining: number;
  advances: number;
  lend: number;
  payments: Payment[];
};

export default function EmployeeSalaryPage() {
  const [data, setData] = useState<SalaryData | null>(null);

  useEffect(() => {
    fetch("/api/my/salary")
      .then((r) => r.json())
      .then(setData)
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">My Salary</h1>
        <p className="page-sub">Payment history — read only</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="card p-4">
          <p className="section-title">
            {data?.salaryType === "DAILY" ? "Daily rate" : "Monthly salary"}
          </p>
          <p className="mt-1 text-lg font-bold tabular-nums">
            {data ? formatLKR(data.salaryAmount) : "—"}
          </p>
        </div>
        <div className="card p-4">
          <p className="section-title">Already received</p>
          <p className="mt-1 text-lg font-bold tabular-nums">
            {data ? formatLKR(data.received) : "—"}
          </p>
        </div>
        <div className="card p-4">
          <p className="section-title">Remaining to receive</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-[var(--accent)]">
            {data ? formatLKR(data.remaining) : "—"}
          </p>
        </div>
        <div className="card p-4">
          <p className="section-title">Lend / advance</p>
          <p className="mt-1 text-lg font-bold tabular-nums">
            {data ? formatLKR(data.lend) : "—"}
          </p>
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-base font-semibold">Recent payments</h2>
        {!data?.payments.length ? (
          <p className="text-sm text-[var(--muted)]">No payments this month.</p>
        ) : (
          <ul className="card divide-y divide-[var(--line-soft)] overflow-hidden">
            {data.payments.map((p) => (
              <li key={p.id} className="flex items-center justify-between px-5 py-3.5">
                <div>
                  <p className="text-sm font-medium">
                    {p.type === "ADVANCE" ? "Advance" : "Payment"}
                  </p>
                  <p className="text-xs text-[var(--muted)]">
                    {new Date(p.date).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                    })}
                    {p.notes ? ` · ${p.notes}` : ""}
                  </p>
                </div>
                <p className="font-semibold tabular-nums">{formatLKR(p.amount)}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
