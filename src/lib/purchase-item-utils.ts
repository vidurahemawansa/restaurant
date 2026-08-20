export function computeLineTotal(quantity: number, unitPrice: number): number {
  return Math.round(quantity * unitPrice * 100) / 100;
}

export function normalizePurchaseItemName(name: string): string {
  return name.toLowerCase().replace(/\s+/g, " ").trim();
}
