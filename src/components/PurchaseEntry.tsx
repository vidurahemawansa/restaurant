"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Label } from "@/components/ui";
import { AddPurchaseItemModal } from "@/components/AddPurchaseItemModal";
import { PurchaseItemHistoryPanel } from "@/components/PurchaseItemHistoryPanel";
import { computeLineTotal } from "@/lib/purchase-item-utils";
import { formatLKR, todayInputValue } from "@/lib/utils";

export type PurchaseItemRow = {
  id: string;
  name: string;
  defaultUnit: string | null;
  lastPurchasePrice: number | null;
  useCount: number;
  category: { id: string; name: string };
};

type Category = { id: string; name: string };
type Supplier = { id: string; name: string };

type DraftLine = {
  key: string;
  itemId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  unit: string | null;
};

type PurchaseEntryProps = {
  items: PurchaseItemRow[];
  categories: Category[];
  suppliers: Supplier[];
};

export function PurchaseEntry({ items: initialItems, categories, suppliers }: PurchaseEntryProps) {
  const [items, setItems] = useState(initialItems);
  const [date, setDate] = useState(todayInputValue());
  const [search, setSearch] = useState("");
  const [lines, setLines] = useState<DraftLine[]>([]);
  const [selectedItem, setSelectedItem] = useState<PurchaseItemRow | null>(null);
  const [quantity, setQuantity] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [showMore, setShowMore] = useState(false);
  const [notes, setNotes] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [historyItemId, setHistoryItemId] = useState<string | null>(null);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const qtyRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  const frequentItems = useMemo(
    () => [...items].sort((a, b) => b.useCount - a.useCount).slice(0, 8),
    [items]
  );

  const searchResults = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return [];
    return items.filter((i) => i.name.toLowerCase().includes(q)).slice(0, 8);
  }, [items, search]);

  const lineTotal = useMemo(() => {
    const q = Number(quantity);
    const p = Number(unitPrice);
    if (q > 0 && p > 0) return computeLineTotal(q, p);
    return 0;
  }, [quantity, unitPrice]);

  const cartTotal = lines.reduce((s, l) => s + l.amount, 0);

  function selectItem(item: PurchaseItemRow) {
    setSelectedItem(item);
    setSearch(item.name);
    setShowSearchResults(false);
    setQuantity("");
    setUnitPrice("");
    setError(null);
    setTimeout(() => qtyRef.current?.focus(), 50);
  }

  function clearSelection() {
    setSelectedItem(null);
    setSearch("");
    setQuantity("");
    setUnitPrice("");
  }

  function addLine() {
    if (!selectedItem) return;
    const q = Number(quantity);
    const p = Number(unitPrice);
    if (!(q > 0)) {
      setError("Enter quantity");
      return;
    }
    if (!(p > 0)) {
      setError("Enter unit price");
      return;
    }
    const amount = computeLineTotal(q, p);
    setLines((prev) => [
      ...prev,
      {
        key: `${selectedItem.id}-${Date.now()}`,
        itemId: selectedItem.id,
        name: selectedItem.name,
        quantity: q,
        unitPrice: p,
        amount,
        unit: selectedItem.defaultUnit,
      },
    ]);
    clearSelection();
    setMessage(null);
    setError(null);
  }

  function removeLine(key: string) {
    setLines((prev) => prev.filter((l) => l.key !== key));
  }

  function handleItemCreated(item: {
    id: string;
    name: string;
    defaultUnit: string | null;
    lastPurchasePrice: number | null;
    category: { id: string; name: string };
  }) {
    const row: PurchaseItemRow = {
      id: item.id,
      name: item.name,
      defaultUnit: item.defaultUnit,
      lastPurchasePrice: item.lastPurchasePrice,
      useCount: 0,
      category: item.category,
    };
    setItems((prev) => [...prev, row]);
    selectItem(row);
  }

  async function onSave(e: FormEvent) {
    e.preventDefault();
    if (!lines.length) {
      setError("Add at least one item");
      return;
    }
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/purchases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          notes: showMore ? notes || null : null,
          invoiceNumber: showMore ? invoiceNumber || null : null,
          paymentMethod: showMore ? paymentMethod || null : null,
          lines: lines.map((l) => ({
            itemId: l.itemId,
            quantity: l.quantity,
            unitPrice: l.unitPrice,
            amount: l.amount,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      setLines([]);
      setNotes("");
      setInvoiceNumber("");
      setPaymentMethod("");
      setMessage(`Saved — ${formatLKR(data.totalAmount)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <form onSubmit={onSave} className="space-y-6">
        <div className="panel space-y-4">
          <label className="block">
            <Label>Date</Label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="field"
            />
          </label>

          {/* Search / select item */}
          <div className="relative">
            <Label>Select item</Label>
            <div className="mt-1 flex gap-2">
              <input
                ref={searchRef}
                type="search"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setShowSearchResults(true);
                  if (selectedItem && e.target.value !== selectedItem.name) {
                    setSelectedItem(null);
                  }
                }}
                onFocus={() => setShowSearchResults(true)}
                placeholder="Search: prawns, rice, sauce…"
                className="field field-lg min-w-0 flex-1"
                autoComplete="off"
              />
              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="btn-outline shrink-0 whitespace-nowrap"
              >
                + New item
              </button>
            </div>

            {showSearchResults && search.trim() && searchResults.length > 0 && !selectedItem ? (
              <ul className="absolute z-20 mt-1 max-h-48 w-full overflow-y-auto rounded-xl border border-[var(--line-soft)] bg-[var(--surface)] shadow-lg">
                {searchResults.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => selectItem(item)}
                      className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm hover:bg-[var(--surface-2)]"
                    >
                      <span>
                        <span className="font-medium">{item.name}</span>
                        <span className="ml-2 text-[var(--muted)]">{item.category.name}</span>
                      </span>
                      {item.lastPurchasePrice ? (
                        <span className="text-xs text-[var(--muted)]">
                          {formatLKR(item.lastPurchasePrice)}
                          {item.defaultUnit ? `/${item.defaultUnit}` : ""}
                        </span>
                      ) : null}
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          {/* Frequent / recent */}
          {!selectedItem && !search.trim() ? (
            <div>
              <Label>Frequently purchased</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {frequentItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => selectItem(item)}
                    className="chip"
                  >
                    {item.name}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {/* Line entry */}
          {selectedItem ? (
            <div className="panel-accent space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <Label>Adding</Label>
                  <p className="text-lg font-semibold">{selectedItem.name}</p>
                  <p className="text-xs text-[var(--muted)]">
                    {selectedItem.category.name}
                    {selectedItem.defaultUnit ? ` · ${selectedItem.defaultUnit}` : ""}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setHistoryItemId(selectedItem.id)}
                  className="text-xs font-medium text-[var(--accent)] hover:underline"
                >
                  View history
                </button>
              </div>

              {selectedItem.lastPurchasePrice != null ? (
                <p className="rounded-lg bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--muted)]">
                  Last purchased:{" "}
                  <strong className="text-[var(--ink)]">
                    {formatLKR(selectedItem.lastPurchasePrice)}
                    {selectedItem.defaultUnit ? ` / ${selectedItem.defaultUnit}` : ""}
                  </strong>
                  <span className="ml-1">(reference only)</span>
                </p>
              ) : null}

              <div className="flex flex-wrap items-end gap-3">
                <label className="block">
                  <Label>Quantity</Label>
                  <input
                    ref={qtyRef}
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="0.01"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="field field-lg w-28"
                    placeholder="2"
                  />
                </label>
                <label className="block">
                  <Label>Unit price (Rs.)</Label>
                  <input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="1"
                    value={unitPrice}
                    onChange={(e) => setUnitPrice(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addLine();
                      }
                    }}
                    className="field field-lg w-36"
                    placeholder={
                      selectedItem.lastPurchasePrice
                        ? String(selectedItem.lastPurchasePrice)
                        : "2600"
                    }
                  />
                </label>
                {lineTotal > 0 ? (
                  <div className="pb-2">
                    <p className="text-xs text-[var(--muted)]">Total</p>
                    <p className="text-lg font-bold tabular-nums">{formatLKR(lineTotal)}</p>
                  </div>
                ) : null}
                <button type="button" onClick={addLine} className="btn-primary">
                  Add
                </button>
                <button type="button" onClick={clearSelection} className="btn-ghost">
                  Cancel
                </button>
              </div>
            </div>
          ) : null}
        </div>

        {lines.length > 0 ? (
          <div className="card overflow-hidden">
            <ul className="divide-y divide-[var(--line-soft)]">
              {lines.map((line) => (
                <li key={line.key} className="flex items-center justify-between gap-3 px-5 py-3.5">
                  <div>
                    <p className="font-medium">{line.name}</p>
                    <p className="text-xs text-[var(--muted)]">
                      {line.quantity}
                      {line.unit ? ` ${line.unit}` : ""} × {formatLKR(line.unitPrice)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold tabular-nums">{formatLKR(line.amount)}</span>
                    <button
                      type="button"
                      onClick={() => removeLine(line.key)}
                      className="text-sm text-[var(--danger)]"
                    >
                      Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>
            <div className="flex items-center justify-between border-t border-[var(--line-soft)] bg-[var(--surface-2)] px-5 py-4">
              <span className="section-title">Total</span>
              <span className="text-xl font-bold tabular-nums">{formatLKR(cartTotal)}</span>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-[var(--line)] bg-[var(--surface-2)] px-6 py-10 text-center text-sm text-[var(--muted)]">
            Search or tap an item to start
          </div>
        )}

        <div>
          <button
            type="button"
            onClick={() => setShowMore((v) => !v)}
            className="text-sm font-medium text-[var(--accent)] hover:underline"
          >
            {showMore ? "Hide optional details" : "Optional details →"}
          </button>
          {showMore ? (
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <label className="block">
                <Label>Invoice #</Label>
                <input
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  className="field w-full"
                />
              </label>
              <label className="block">
                <Label>Payment</Label>
                <input
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  placeholder="Cash / Bank"
                  className="field w-full"
                />
              </label>
              <label className="block">
                <Label>Notes</Label>
                <input value={notes} onChange={(e) => setNotes(e.target.value)} className="field w-full" />
              </label>
            </div>
          ) : null}
        </div>

        {error ? <p className="alert alert-error">{error}</p> : null}
        {message ? <p className="alert alert-success">{message}</p> : null}

        <button
          type="submit"
          disabled={saving || lines.length === 0}
          className="btn-primary btn-lg w-full sm:w-auto"
        >
          {saving ? "Saving…" : `Save purchase — ${formatLKR(cartTotal)}`}
        </button>
      </form>

      <AddPurchaseItemModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        categories={categories}
        suppliers={suppliers}
        initialName={search.trim()}
        onCreated={handleItemCreated}
      />

      {historyItemId ? (
        <PurchaseItemHistoryPanel itemId={historyItemId} onClose={() => setHistoryItemId(null)} />
      ) : null}
    </>
  );
}
