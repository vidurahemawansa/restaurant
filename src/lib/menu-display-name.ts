/** Kitchen short names already used on tickets / KOTs. */
const KNOWN_SHORT_NAMES: Record<string, string> = {
  "chicken fried rice": "Ch. Rice - F",
  "egg fried rice": "Egg Rice - F",
  "chicken kottu": "Ch. Kottu",
  "beef kottu": "Bf. Kottu",
};

export function menuDisplayName(name: string, shortName?: string | null): string {
  const stored = shortName?.trim();
  if (stored) return stored;
  const known = KNOWN_SHORT_NAMES[name.trim().toLowerCase()];
  if (known) return known;
  return name;
}

export type TicketLineLike = {
  quantity: number;
  name?: string | null;
  shortName?: string | null;
  menuItem?: { name: string; shortName?: string | null } | null;
};

export function formatTicketItemSummary(lines: TicketLineLike[]): string {
  return lines
    .map((line) => {
      const name = menuDisplayName(
        line.menuItem?.name ?? line.name ?? "",
        line.shortName ?? line.menuItem?.shortName
      );
      return `${line.quantity} ${name}`.trim();
    })
    .filter((part) => part.length > 1)
    .join(", ");
}
