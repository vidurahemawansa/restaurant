"use client";

import { FormEvent, useEffect, useState } from "react";
import { Label } from "@/components/ui";

type Category = { id: string; name: string };
type Supplier = { id: string; name: string };
type CreatedItem = {
  id: string;
  name: string;
  defaultUnit: string | null;
  lastPurchasePrice: number | null;
  category: Category;
};

type AddPurchaseItemModalProps = {
  open: boolean;
  onClose: () => void;
  categories: Category[];
  suppliers: Supplier[];
  initialName?: string;
  onCreated: (item: CreatedItem) => void;
};

export function AddPurchaseItemModal({
  open,
  onClose,
  categories,
  suppliers,
  initialName = "",
  onCreated,
}: AddPurchaseItemModalProps) {
  const [name, setName] = useState(initialName);
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");
  const [defaultUnit, setDefaultUnit] = useState("kg");
  const [defaultSupplierId, setDefaultSupplierId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [similarItem, setSimilarItem] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    if (open) {
      setName(initialName);
      setCategoryId(categories[0]?.id ?? "");
      setError(null);
      setSimilarItem(null);
    }
  }, [open, initialName, categories]);

  if (!open) return null;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSimilarItem(null);
    try {
      const res = await fetch("/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          categoryId,
          defaultUnit: defaultUnit || null,
          defaultSupplierId: defaultSupplierId || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.similarItem) setSimilarItem(data.similarItem);
        throw new Error(data.error || "Failed to create item");
      }
      onCreated(data.item);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create item");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div className="card w-full max-w-md p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">Add purchase item</h2>
          <button type="button" onClick={onClose} className="btn-ghost text-sm">
            Close
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <label className="block">
            <Label>Item name *</Label>
            <input
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="field field-lg w-full"
              placeholder="Oyster Sauce"
            />
          </label>
          <label className="block">
            <Label>Category *</Label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="field w-full"
              required
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <Label>Default unit</Label>
            <input
              value={defaultUnit}
              onChange={(e) => setDefaultUnit(e.target.value)}
              className="field w-full"
              placeholder="kg, bottle, pcs"
            />
          </label>
          {suppliers.length > 0 ? (
            <label className="block">
              <Label>Default supplier (optional)</Label>
              <select
                value={defaultSupplierId}
                onChange={(e) => setDefaultSupplierId(e.target.value)}
                className="field w-full"
              >
                <option value="">None</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          {similarItem ? (
            <p className="alert alert-error text-sm">
              Similar item exists: <strong>{similarItem.name}</strong>. Select it from search
              instead.
            </p>
          ) : null}
          {error && !similarItem ? <p className="alert alert-error">{error}</p> : null}

          <button type="submit" disabled={saving} className="btn-primary btn-lg w-full">
            {saving ? "Saving…" : "Save & select item"}
          </button>
        </form>
      </div>
    </div>
  );
}
