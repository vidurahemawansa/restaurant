"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatLKR } from "@/lib/utils";

type SalaryData = {
  employeeName: string;
  salaryType: "DAILY" | "MONTHLY";
  salaryAmount: number;
  rateLabel: string;
  received: number;
  remaining: number;
  advances: number;
  lend: number;
};

export default function EmployeeHomePage() {
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
        <h1 className="page-title">My Dashboard</h1>
        <p className="page-sub">{data?.employeeName ?? "Loading…"}</p>
      </div>

      <div className="card p-5">
        <p className="section-title">
          {data?.salaryType === "DAILY" ? "Daily rate" : "Monthly salary"}
        </p>
        <p className="mt-2 text-3xl font-bold tabular-nums">
          {data ? formatLKR(data.salaryAmount) : "—"}
        </p>
        {data ? <p className="mt-1 text-sm text-[var(--muted)]">{data.rateLabel}</p> : null}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="card p-4">
          <p className="section-title">Received</p>
          <p className="mt-1 text-xl font-bold tabular-nums text-[var(--success)]">
            {data ? formatLKR(data.received) : "—"}
          </p>
        </div>
        <div className="card p-4">
          <p className="section-title">Remaining</p>
          <p className="mt-1 text-xl font-bold tabular-nums">
            {data ? formatLKR(data.remaining) : "—"}
          </p>
        </div>
      </div>

      {data && data.lend > 0 ? (
        <p className="text-sm text-amber-700">
          Advance / lend balance: {formatLKR(data.lend)}
        </p>
      ) : null}

      <Link href="/my/salary" className="btn-primary btn-lg block w-full text-center">
        View payment history
      </Link>
    </div>
  );
}
