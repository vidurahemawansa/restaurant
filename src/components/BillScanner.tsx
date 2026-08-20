"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CONFIDENCE_HIGH } from "@/lib/bills/constants";
import type { BillScanItem, BillScanResult, MenuRef } from "@/lib/bills/types";
import { formatLKR, todayInputValue } from "@/lib/utils";

type Step = "capture" | "processing" | "review" | "saved";

type EditableLine = BillScanItem & { key: string };

type MenuItem = MenuRef;

function newLineKey() {
  return `new-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function StatusBadge({ item }: { item: EditableLine }) {
  if (!item.needsReview && item.menuItemId) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-[var(--success)]">
        ✓ High confidence
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-[var(--warn)]">
      ⚠ Needs review
    </span>
  );
}

export function BillScanner({ menuItems }: { menuItems: MenuItem[] }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("capture");
  const [date, setDate] = useState(todayInputValue());
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [scanMeta, setScanMeta] = useState<Pick<
    BillScanResult,
    | "handwrittenTotal"
    | "calculatedTotal"
    | "totalMismatch"
    | "discount"
    | "warnings"
    | "unreadable"
    | "imageQuality"
  > | null>(null);
  const [lines, setLines] = useState<EditableLine[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedTotal, setSavedTotal] = useState<number | null>(null);
  const [confirmMismatch, setConfirmMismatch] = useState(false);

  const calculatedTotal = useMemo(() => {
    const sub = lines.reduce((sum, l) => sum + l.quantity * l.unitPrice, 0);
    const discount = scanMeta?.discount ?? 0;
    return sub - discount;
  }, [lines, scanMeta?.discount]);

  const totalMismatch = useMemo(() => {
    if (scanMeta?.handwrittenTotal == null) return false;
    return Math.abs(scanMeta.handwrittenTotal - calculatedTotal) > 50;
  }, [scanMeta?.handwrittenTotal, calculatedTotal]);

  const reset = useCallback(() => {
    setStep("capture");
    setImageFile(null);
    setImagePreview(null);
    setScanMeta(null);
    setLines([]);
    setError(null);
    setSaving(false);
    setSavedTotal(null);
    setConfirmMismatch(false);
    if (fileRef.current) fileRef.current.value = "";
    if (cameraRef.current) cameraRef.current.value = "";
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    reset();
  }, [reset]);

  function handleFile(file: File | null) {
    if (!file) return;
    setError(null);
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setStep("capture");
  }

  async function runScan(file: File) {
    setStep("processing");
    setError(null);

    const formData = new FormData();
    formData.append("image", file);

    try {
      const res = await fetch("/api/bills/scan", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Scan failed");

      const result = data as BillScanResult & { menu?: MenuRef[] };

      setScanMeta({
        handwrittenTotal: result.handwrittenTotal,
        calculatedTotal: result.calculatedTotal,
        totalMismatch: result.totalMismatch,
        discount: result.discount,
        warnings: result.warnings,
        unreadable: result.unreadable,
        imageQuality: result.imageQuality,
      });

      setLines(
        result.items.map((item) => ({
          ...item,
          key: item.id,
          lineTotal: item.quantity * item.unitPrice,
        }))
      );

      if (result.imageDataUrl) {
        setImagePreview(result.imageDataUrl);
      }

      setStep("review");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Scan failed");
      setStep("capture");
    }
  }

  function updateLine(key: string, patch: Partial<EditableLine>) {
    setLines((prev) =>
      prev.map((line) => {
        if (line.key !== key) return line;
        const next = { ...line, ...patch };
        if (patch.menuItemId != null) {
          const menu = menuItems.find((m) => m.id === patch.menuItemId);
          if (menu) {
            next.menuItemName = menu.name;
            next.name = menu.name;
            if (patch.unitPrice === undefined) {
              next.unitPrice = menu.price;
            }
          }
        }
        next.lineTotal = next.quantity * next.unitPrice;
        next.needsReview =
          !next.menuItemId ||
          next.confidence < CONFIDENCE_HIGH ||
          next.quantity <= 0 ||
          next.unitPrice < 0;
        return next;
      })
    );
  }

  function removeLine(key: string) {
    setLines((prev) => prev.filter((l) => l.key !== key));
  }

  function addLine() {
    const first = menuItems[0];
    setLines((prev) => [
      ...prev,
      {
        key: newLineKey(),
        id: newLineKey(),
        rawText: "",
        name: first?.name ?? "",
        menuItemId: first?.id ?? null,
        menuItemName: first?.name ?? null,
        quantity: 1,
        unitPrice: first?.price ?? 0,
        lineTotal: first?.price ?? 0,
        confidence: 0,
        needsReview: true,
        reviewReasons: ["Added manually"],
      },
    ]);
  }

  async function confirmSave(forceMismatch = false) {
    setError(null);

    if (!lines.length) {
      setError("Add at least one item");
      return;
    }

    for (const line of lines) {
      if (!line.menuItemId) {
        setError("Every row must have a menu item selected");
        return;
      }
      if (!(line.quantity > 0)) {
        setError("Quantity must be greater than 0");
        return;
      }
      if (line.unitPrice < 0) {
        setError("Invalid unit price");
        return;
      }
    }

    if (totalMismatch && !forceMismatch && !confirmMismatch) {
      setError(
        "The handwritten total doesn't match the calculated total. Please verify before saving."
      );
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          lines: lines.map((l) => ({
            menuItemId: l.menuItemId,
            quantity: l.quantity,
            unitPrice: l.unitPrice,
          })),
          discount: scanMeta?.discount ?? 0,
          handwrittenTotal: scanMeta?.handwrittenTotal,
          confirmTotalMismatch: forceMismatch || confirmMismatch || !totalMismatch,
        }),
      });

      const data = await res.json();

      if (res.status === 409 && data.requiresConfirmation) {
        setConfirmMismatch(true);
        setError(data.message);
        return;
      }

      if (!res.ok) throw new Error(data.error || data.message || "Save failed");

      setSavedTotal(data.totalAmount);
      setStep("saved");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="btn-outline">
        <span aria-hidden>📷</span>
        Scan Bill
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="bill-scanner-title"
        className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-t-[var(--radius-lg)] bg-[var(--surface)] shadow-[var(--shadow-lg)] sm:rounded-[var(--radius-lg)]"
      >
        <div className="flex items-center justify-between border-b border-[var(--line-soft)] px-5 py-4">
          <div>
            <h2 id="bill-scanner-title" className="text-lg font-bold">
              Scan Bill
            </h2>
            <p className="text-xs text-[var(--muted)]">Review before saving</p>
          </div>
          <button type="button" onClick={close} className="btn-ghost text-lg leading-none">
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          {step === "capture" && (
            <div className="space-y-4">
              <p className="text-sm text-[var(--muted)]">
                Take a photo or upload an image of the handwritten bill. AI will extract items —
                nothing is saved until you confirm.
              </p>

              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => cameraRef.current?.click()}
                  className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[var(--accent)] bg-[var(--accent-soft)] px-6 py-10 text-center transition hover:bg-[var(--accent)]/10"
                >
                  <span className="text-3xl" aria-hidden>
                    📸
                  </span>
                  <span className="font-semibold">Take Photo</span>
                  <span className="text-xs text-[var(--muted)]">Use device camera</span>
                </button>

                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[var(--line)] bg-[var(--surface-2)] px-6 py-10 text-center transition hover:border-[var(--accent)]"
                >
                  <span className="text-3xl" aria-hidden>
                    🖼
                  </span>
                  <span className="font-semibold">Upload Image</span>
                  <span className="text-xs text-[var(--muted)]">JPEG, PNG, WebP · max 10 MB</span>
                </button>
              </div>

              <input
                ref={cameraRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                capture="environment"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
              />
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
              />

              {imagePreview ? (
                <div className="space-y-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imagePreview}
                    alt="Bill preview"
                    className="max-h-64 w-full rounded-xl border border-[var(--line)] object-contain bg-[var(--surface-2)]"
                  />
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => imageFile && runScan(imageFile)}
                      className="btn-primary"
                    >
                      Process Bill
                    </button>
                    <button type="button" onClick={reset} className="btn-ghost">
                      Choose different image
                    </button>
                  </div>
                </div>
              ) : null}

              {error ? <p className="alert alert-error">{error}</p> : null}
            </div>
          )}

          {step === "processing" && (
            <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-[var(--line)] border-t-[var(--accent)]" />
              <p className="font-medium">Reading handwritten bill…</p>
              <p className="text-sm text-[var(--muted)]">
                Matching items against your menu
              </p>
            </div>
          )}

          {step === "review" && (
            <div className="space-y-5">
              <label className="block">
                <span className="mb-1 block text-xs uppercase tracking-wide text-[var(--muted)]">
                  Sale date
                </span>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="field"
                />
              </label>

              {scanMeta?.warnings?.length ? (
                <ul className="alert alert-warn space-y-1">
                  {scanMeta.warnings.map((w) => (
                    <li key={w}>• {w}</li>
                  ))}
                </ul>
              ) : null}

              <div className="grid gap-4 lg:grid-cols-2">
                <section>
                  <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">
                    Original Bill
                  </h3>
                  {imagePreview ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={imagePreview}
                      alt="Original handwritten bill"
                      className="max-h-80 w-full rounded-xl border border-[var(--line)] object-contain bg-[var(--surface-2)]"
                    />
                  ) : null}
                  {scanMeta?.unreadable ? (
                    <p className="mt-2 text-sm text-[var(--warn)]">
                      Handwriting quality: unclear — please verify every field.
                    </p>
                  ) : null}
                </section>

                <section>
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">
                      Extracted Sale
                    </h3>
                    <button
                      type="button"
                      onClick={() => imageFile && runScan(imageFile)}
                      className="text-xs font-medium text-[var(--accent)] hover:underline"
                    >
                      Re-run extraction
                    </button>
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-[var(--line)]">
                    <table className="min-w-full text-sm">
                      <thead className="bg-[var(--surface-2)] text-left text-xs uppercase tracking-wide text-[var(--muted)]">
                        <tr>
                          <th className="px-3 py-2">Item</th>
                          <th className="px-3 py-2 w-16">Qty</th>
                          <th className="px-3 py-2 w-24">Price</th>
                          <th className="px-3 py-2 w-24">Total</th>
                          <th className="px-3 py-2">Status</th>
                          <th className="px-3 py-2 w-8" />
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--line)]">
                        {lines.map((line) => (
                          <tr
                            key={line.key}
                            className={
                              line.needsReview ? "bg-[var(--warn-soft)]/60" : undefined
                            }
                          >
                            <td className="px-3 py-2">
                              <select
                                value={line.menuItemId ?? ""}
                                onChange={(e) =>
                                  updateLine(line.key, { menuItemId: e.target.value || null })
                                }
                                className={`field w-full min-w-[9rem] text-sm ${
                                  !line.menuItemId ? "border-[var(--warn)]" : ""
                                }`}
                              >
                                <option value="">Select item…</option>
                                {menuItems.map((m) => (
                                  <option key={m.id} value={m.id}>
                                    {m.name}
                                  </option>
                                ))}
                              </select>
                              {line.rawText && line.rawText !== line.name ? (
                                <p className="mt-1 text-xs text-[var(--muted)]">
                                  Read: {line.rawText}
                                </p>
                              ) : null}
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="number"
                                min="1"
                                step="1"
                                inputMode="numeric"
                                value={line.quantity}
                                onChange={(e) =>
                                  updateLine(line.key, {
                                    quantity: Math.max(1, Number(e.target.value) || 1),
                                  })
                                }
                                className={`field w-full text-center ${
                                  line.quantity <= 0 ? "border-[var(--warn)]" : ""
                                }`}
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="number"
                                min="0"
                                step="1"
                                inputMode="decimal"
                                value={line.unitPrice}
                                onChange={(e) =>
                                  updateLine(line.key, {
                                    unitPrice: Math.max(0, Number(e.target.value) || 0),
                                  })
                                }
                                className="field w-full text-right tabular-nums"
                              />
                            </td>
                            <td className="px-3 py-2 text-right tabular-nums font-medium">
                              {formatLKR(line.quantity * line.unitPrice)}
                            </td>
                            <td className="px-3 py-2">
                              <StatusBadge item={line} />
                            </td>
                            <td className="px-3 py-2">
                              <button
                                type="button"
                                onClick={() => removeLine(line.key)}
                                className="text-[var(--danger)]"
                                aria-label="Remove line"
                              >
                                ×
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <button
                    type="button"
                    onClick={addLine}
                    className="mt-2 text-sm font-medium text-[var(--accent)] hover:underline"
                  >
                    + Add missing item
                  </button>

                  <div className="mt-4 space-y-1 rounded-xl bg-[var(--surface-2)] px-4 py-3">
                    {scanMeta?.handwrittenTotal != null ? (
                      <div className="flex justify-between text-sm">
                        <span className="text-[var(--muted)]">Handwritten total</span>
                        <span className="tabular-nums">{formatLKR(scanMeta.handwrittenTotal)}</span>
                      </div>
                    ) : null}
                    <div className="flex justify-between font-semibold">
                      <span>Calculated total</span>
                      <span className="tabular-nums">{formatLKR(calculatedTotal)}</span>
                    </div>
                    {totalMismatch ? (
                      <p className="text-xs text-[var(--warn)]">
                        Totals differ — verify line items before saving.
                      </p>
                    ) : null}
                  </div>
                </section>
              </div>

              {error ? <p className="alert alert-error">{error}</p> : null}

              <div className="flex flex-wrap gap-2 border-t border-[var(--line)] pt-4">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => confirmSave(false)}
                  className="btn-primary"
                >
                  {saving ? "Saving…" : "Confirm & Save Transaction"}
                </button>
                {confirmMismatch || totalMismatch ? (
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => confirmSave(true)}
                    className="rounded-lg border border-[var(--warn)] px-4 py-2 text-sm font-medium text-[var(--warn-text)]"
                  >
                    Save anyway (total mismatch)
                  </button>
                ) : null}
                <button type="button" onClick={reset} className="btn-ghost">
                  Start over
                </button>
              </div>
            </div>
          )}

          {step === "saved" && (
            <div className="space-y-4 py-8 text-center">
              <p className="text-4xl" aria-hidden>
                ✓
              </p>
              <p className="text-xl font-bold">Transaction saved</p>
              {savedTotal != null ? (
                <p className="text-[var(--muted)]">
                  Revenue recorded: <strong>{formatLKR(savedTotal)}</strong>
                </p>
              ) : null}
              <p className="text-sm text-[var(--muted)]">
                Included in dashboard, reports, and sales history like any manual entry.
              </p>
              <button type="button" onClick={close} className="btn-primary">
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
