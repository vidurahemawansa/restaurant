export const ITEM_CATEGORIES = [
  "Meat",
  "Seafood",
  "Dry Goods",
  "Vegetables",
  "Dairy",
  "Drinks",
  "Snacks",
  "Cooking",
  "Packaging",
  "Cleaning",
  "Other",
] as const;

export const EXPENSE_CATEGORIES = [
  "Rent",
  "Utilities",
  "Transport",
  "Maintenance",
  "Marketing",
  "Other",
] as const;

export function formatLKR(amount: number): string {
  return `Rs. ${amount.toLocaleString("en-LK", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

export function formatLKRCompact(amount: number): string {
  if (Math.abs(amount) >= 1000) {
    return `Rs. ${amount.toLocaleString("en-LK", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;
  }
  return formatLKR(amount);
}

export function toDateOnly(date: Date | string): Date {
  const d = typeof date === "string" ? new Date(date) : new Date(date);
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
}

export function startOfDay(date: Date = new Date()): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
}

export function endOfDay(date: Date = new Date()): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
}

export function startOfMonth(date: Date = new Date()): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
}

export function endOfMonth(date: Date = new Date()): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

export function percent(part: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((part / total) * 1000) / 10;
}

export function todayInputValue(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseDateInput(value: string): Date {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d, 12, 0, 0, 0);
}
