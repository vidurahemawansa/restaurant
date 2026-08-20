"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AddPurchaseItemModal } from "@/components/AddPurchaseItemModal";
import { PurchaseItemHistoryPanel } from "@/components/PurchaseItemHistoryPanel";
import { formatLKR } from "@/lib/utils";

type Item = {
  id: string;
  name: string;
  defaultUnit: string | null;
  lastPurchasePrice: number | null;
  active: boolean;
  useCount: number;
  category: { id: string; name: string };
};

type Category = { id: string; name: string };
type Supplier = { id: string; name: string };

export function PurchaseItemMaster({
  initialItems,
  categories,
  suppliers,
}: {
  initialItems: Item[];
  categories: Category[];
  suppliers: Supplier[];
}) {
  const router = useRouter();
  const [filter, setFilter] = useState<"active" | "inactive" | "all">("active");
  const [showAdd, setShowAdd] = useState(false);
  const [historyId, setHistoryId] = useState<string | null>(null);

  const items = initialItems.filter((item) => {
    if (filter === "active") return item.active;
    if (filter === "inactive") return !item.active;
    return true;
  });

  const byCategory = categories
    .map((cat) => ({
      category: cat.name,
      items: items.filter((i) => i.category.id === cat.id),
    }))
    .filter((g) => g.items.length > 0);

  async function toggleActive(item: Item) {
    await fetch(`/api/items/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !item.active }),
    });
    router.refresh();
  }

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 rounded-full bg-[var(--surface-2)] p-1">
          {(["active", "inactive", "all"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`rounded-full px-3 py-1 text-sm font-medium capitalize ${
                filter === f ? "bg-[var(--surface)] text-[var(--accent)] shadow-sm" : "text-[var(--muted)]"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <button type="button" onClick={() => setShowAdd(true)} className="btn-primary">
          + Add item
        </button>
      </div>

      <div className="space-y-6">
        {byCategory.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">No items in this filter.</p>
        ) : (
          byCategory.map((group) => (
            <section key={group.category}>
              <h2 className="mb-2 text-lg font-semibold">{group.category}</h2>
              <ul className="divide-y divide-[var(--line)] overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--surface)]">
                {group.items.map((item) => (
                  <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-xs text-[var(--muted)]">
                        {item.defaultUnit ? `Unit: ${item.defaultUnit}` : "No unit"}
                        {item.lastPurchasePrice
                          ? ` · Last: ${formatLKR(item.lastPurchasePrice)}`
                          : ""}
                        {` · used ${item.useCount}×`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setHistoryId(item.id)}
                        className="btn-ghost text-xs"
                      >
                        History
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleActive(item)}
                        className={`rounded-md px-2 py-0.5 text-xs ${
                          item.active
                            ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                            : "bg-[var(--surface-2)] text-[var(--muted)]"
                        }`}
                      >
                        {item.active ? "Active" : "Inactive"}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))
        )}
      </div>

      <AddPurchaseItemModal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        categories={categories}
        suppliers={suppliers}
        onCreated={() => {
          setShowAdd(false);
          router.refresh();
        }}
      />

      {historyId ? (
        <PurchaseItemHistoryPanel itemId={historyId} onClose={() => setHistoryId(null)} />
      ) : null}
    </>
  );
}
