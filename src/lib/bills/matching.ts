import { CONFIDENCE_HIGH } from "./constants";
import type { AiRawBillItem, BillScanItem, MenuRef } from "./types";

function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenOverlap(a: string, b: string): number {
  const ta = new Set(normalize(a).split(" ").filter(Boolean));
  const tb = new Set(normalize(b).split(" ").filter(Boolean));
  if (!ta.size || !tb.size) return 0;
  let shared = 0;
  for (const t of ta) {
    if (tb.has(t)) shared++;
  }
  return shared / Math.max(ta.size, tb.size);
}

function findMenuMatch(
  name: string,
  menuItemId: string | null | undefined,
  menu: MenuRef[]
): { item: MenuRef | null; matchConfidence: number; reason?: string } {
  if (menuItemId) {
    const byId = menu.find((m) => m.id === menuItemId);
    if (byId) return { item: byId, matchConfidence: 0.95 };
    return { item: null, matchConfidence: 0, reason: "AI suggested unknown menu item" };
  }

  const n = normalize(name);
  if (!n) return { item: null, matchConfidence: 0, reason: "Empty item name" };

  const exact = menu.find((m) => normalize(m.name) === n);
  if (exact) return { item: exact, matchConfidence: 0.92 };

  let best: MenuRef | null = null;
  let bestScore = 0;

  for (const m of menu) {
    const mn = normalize(m.name);
    if (mn.includes(n) || n.includes(mn)) {
      const score = 0.85;
      if (score > bestScore) {
        bestScore = score;
        best = m;
      }
      continue;
    }
    const overlap = tokenOverlap(name, m.name);
    if (overlap > bestScore) {
      bestScore = overlap;
      best = m;
    }
  }

  if (best && bestScore >= 0.5) {
    return { item: best, matchConfidence: bestScore * 0.9 };
  }

  return { item: null, matchConfidence: 0, reason: "No reliable menu match" };
}

export function buildScanItems(
  rawItems: AiRawBillItem[],
  menu: MenuRef[]
): BillScanItem[] {
  const results: BillScanItem[] = [];

  rawItems.forEach((raw, index) => {
    const { item, matchConfidence, reason } = findMenuMatch(
      raw.name,
      raw.menuItemId,
      menu
    );

    const aiConfidence = typeof raw.confidence === "number" ? raw.confidence : 0.5;
    const confidence = item
      ? Math.min(1, aiConfidence * 0.6 + matchConfidence * 0.4)
      : Math.min(aiConfidence, 0.4);

    const reviewReasons: string[] = [];
    if (raw.uncertain) reviewReasons.push("AI marked as uncertain");
    if (reason) reviewReasons.push(reason);
    if (!item) reviewReasons.push("Select menu item manually");

    const quantity =
      raw.quantity != null && Number(raw.quantity) > 0
        ? Math.round(Number(raw.quantity))
        : 1;
    const quantityUncertain = raw.quantity == null || Number(raw.quantity) <= 0;
    if (quantityUncertain) {
      reviewReasons.push("Quantity not clearly read — verify");
    }

    let unitPrice = 0;
    const priceFromBill =
      raw.unitPrice != null && Number(raw.unitPrice) >= 0
        ? Number(raw.unitPrice)
        : null;

    if (priceFromBill != null) {
      unitPrice = priceFromBill;
    } else if (item) {
      unitPrice = item.price;
    } else {
      reviewReasons.push("Price missing — enter manually");
    }

    const needsReview =
      !item ||
      raw.uncertain === true ||
      confidence < CONFIDENCE_HIGH ||
      quantityUncertain ||
      (priceFromBill == null && !item);

    results.push({
      id: `line-${index}-${Date.now()}`,
      rawText: raw.rawText || raw.name,
      name: item?.name ?? raw.name,
      menuItemId: item?.id ?? null,
      menuItemName: item?.name ?? null,
      quantity,
      unitPrice,
      lineTotal: quantity * unitPrice,
      confidence: Math.round(confidence * 100) / 100,
      needsReview,
      reviewReasons: [...new Set(reviewReasons)],
    });
  });

  return results;
}
