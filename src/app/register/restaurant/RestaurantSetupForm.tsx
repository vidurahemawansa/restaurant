"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

const CATEGORIES = [
  "Restaurant",
  "Cafe",
  "Fast Food",
  "Bakery",
  "Cloud Kitchen",
  "Bar",
  "Other",
];

export function RestaurantSetupForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Restaurant");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [openingTime, setOpeningTime] = useState("08:00");
  const [closingTime, setClosingTime] = useState("22:00");
  const [currency, setCurrency] = useState("LKR");
  const [taxRate, setTaxRate] = useState("");
  const [deliveryEnabled, setDeliveryEnabled] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/restaurants/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          category,
          address,
          phone,
          whatsapp,
          email,
          openingTime,
          closingTime,
          currency,
          taxRate: taxRate || null,
          deliveryEnabled,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed");
      router.push(data.redirectTo || "/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="card space-y-4 p-6">
      <label className="block">
        <span className="section-title mb-1.5 block">Restaurant name *</span>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="field field-lg w-full"
          placeholder="My Restaurant"
        />
      </label>

      <label className="block">
        <span className="section-title mb-1.5 block">Type / category</span>
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="field w-full">
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="section-title mb-1.5 block">Address</span>
        <textarea
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          rows={2}
          className="field w-full resize-none"
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="section-title mb-1.5 block">Phone</span>
          <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="field w-full" />
        </label>
        <label className="block">
          <span className="section-title mb-1.5 block">WhatsApp</span>
          <input type="tel" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} className="field w-full" />
        </label>
      </div>

      <label className="block">
        <span className="section-title mb-1.5 block">Email</span>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="field w-full" />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="section-title mb-1.5 block">Opening time</span>
          <input type="time" value={openingTime} onChange={(e) => setOpeningTime(e.target.value)} className="field w-full" />
        </label>
        <label className="block">
          <span className="section-title mb-1.5 block">Closing time</span>
          <input type="time" value={closingTime} onChange={(e) => setClosingTime(e.target.value)} className="field w-full" />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="section-title mb-1.5 block">Currency</span>
          <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="field w-full">
            <option value="LKR">LKR — Sri Lankan Rupee</option>
            <option value="USD">USD</option>
            <option value="INR">INR</option>
          </select>
        </label>
        <label className="block">
          <span className="section-title mb-1.5 block">Tax rate (%)</span>
          <input
            type="number"
            min="0"
            max="100"
            step="0.1"
            value={taxRate}
            onChange={(e) => setTaxRate(e.target.value)}
            className="field w-full"
            placeholder="Optional"
          />
        </label>
      </div>

      <label className="flex items-center gap-3">
        <input
          type="checkbox"
          checked={deliveryEnabled}
          onChange={(e) => setDeliveryEnabled(e.target.checked)}
          className="h-4 w-4 rounded border-[var(--line)]"
        />
        <span className="text-sm font-medium">Delivery enabled</span>
      </label>

      {error ? <p className="alert alert-error">{error}</p> : null}
      <button type="submit" disabled={loading} className="btn-primary btn-lg w-full">
        {loading ? "Saving…" : "Save & go to dashboard"}
      </button>
    </form>
  );
}
