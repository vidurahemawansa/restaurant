"use client";

import { useEffect, useState } from "react";
import { formatLKR } from "@/lib/utils";

type HistoryData = {
  item: { name: string; defaultUnit: string | null; categoryName: string };
  lines: {
    id: string;
    date: string;
    quantity: number | null;
    unitPrice: number | null;
    amount: number;
  }[];
  stats: {
    totalQuantity: number | null;
    totalAmount: number;
    averageUnitPrice: number | null;
    latestUnitPrice: number | null;
    highestUnitPrice: number | null;
    lowestUnitPrice: number | null;
    purchaseCount: number;
  };
};

export function PurchaseItemHistoryPanel({
  itemId,
  onClose,
}: {
  itemId: string;
  onClose: () => void;
}) {
  const [data, setData] = useState<HistoryData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/items/${itemId}/history`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [itemId]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div className="card max-h-[85vh] w-full max-w-lg overflow-y-auto p-6 shadow-xl">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold">{data?.item.name ?? "Purchase history"}</h2>
            {data ? (
              <p className="text-sm text-[var(--muted)]">
                {data.item.categoryName}
                {data.item.defaultUnit ? ` · ${data.item.defaultUnit}` : ""}
              </p>
            ) : null}
          </div>
          <button type="button" onClick={onClose} className="btn-ghost text-sm">
            Close
          </button>
        </div>

        {loading ? (
          <p className="text-sm text-[var(--muted)]">Loading…</p>
        ) : !data ? (
          <p className="text-sm text-[var(--muted)]">Could not load history.</p>
        ) : (
          <>
            <div className="mb-4 grid grid-cols-2 gap-2 text-sm">
              <Stat label="Total spent" value={formatLKR(data.stats.totalAmount)} />
              <Stat label="Purchases" value={String(data.stats.purchaseCount)} />
              {data.stats.totalQuantity != null ? (
                <Stat label="Total qty" value={String(data.stats.totalQuantity)} />
              ) : null}
              {data.stats.averageUnitPrice != null ? (
                <Stat label="Avg price" value={formatLKR(data.stats.averageUnitPrice)} />
              ) : null}
              {data.stats.latestUnitPrice != null ? (
                <Stat label="Latest" value={formatLKR(data.stats.latestUnitPrice)} />
              ) : null}
              {data.stats.lowestUnitPrice != null ? (
                <Stat label="Lowest" value={formatLKR(data.stats.lowestUnitPrice)} />
              ) : null}
              {data.stats.highestUnitPrice != null ? (
                <Stat label="Highest" value={formatLKR(data.stats.highestUnitPrice)} />
              ) : null}
            </div>

            {data.lines.length === 0 ? (
              <p className="text-sm text-[var(--muted)]">No purchases recorded yet.</p>
            ) : (
              <ul className="divide-y divide-[var(--line-soft)] rounded-xl border border-[var(--line-soft)]">
                {data.lines.map((line) => (
                  <li key={line.id} className="flex items-center justify-between px-4 py-3 text-sm">
                    <div>
                      <p className="font-medium">
                        {new Date(line.date).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                        })}
                      </p>
                      <p className="text-xs text-[var(--muted)]">
                        {line.quantity != null ? `${line.quantity} ${data.item.defaultUnit ?? "units"}` : "—"}
                        {line.unitPrice != null ? ` · ${formatLKR(line.unitPrice)}/unit` : ""}
                      </p>
                    </div>
                    <span className="font-semibold tabular-nums">{formatLKR(line.amount)}</span>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-[var(--surface-2)] px-3 py-2">
      <p className="text-[10px] font-semibold uppercase text-[var(--muted)]">{label}</p>
      <p className="font-bold tabular-nums">{value}</p>
    </div>
  );
}
