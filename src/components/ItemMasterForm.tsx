"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function ItemMasterForm({ categories }: { categories: readonly string[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [category, setCategory] = useState(categories[0] ?? "Other");
  const [unit, setUnit] = useState("kg");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSave(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, category, unit: unit || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      setName("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSave} className="grid gap-3 rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4 sm:grid-cols-4">
      <label className="block sm:col-span-1">
        <span className="mb-1 block text-xs text-[var(--muted)]">Name</span>
        <input required value={name} onChange={(e) => setName(e.target.value)} className="field w-full" placeholder="Chicken" />
      </label>
      <label className="block">
        <span className="mb-1 block text-xs text-[var(--muted)]">Category</span>
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="field w-full">
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="mb-1 block text-xs text-[var(--muted)]">Unit (optional)</span>
        <input value={unit} onChange={(e) => setUnit(e.target.value)} className="field w-full" placeholder="kg" />
      </label>
      <div className="flex items-end">
        <button type="submit" disabled={saving} className="btn-primary w-full">
          {saving ? "Adding…" : "Add item"}
        </button>
      </div>
      {error ? <p className="text-sm text-[var(--danger)] sm:col-span-4">{error}</p> : null}
    </form>
  );
}
