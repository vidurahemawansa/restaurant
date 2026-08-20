"use client";

const RANGES = [
  { id: "today", label: "Today" },
  { id: "yesterday", label: "Yesterday" },
  { id: "week", label: "This Week" },
  { id: "last_week", label: "Last Week" },
  { id: "month", label: "This Month" },
  { id: "last_month", label: "Last Month" },
] as const;

type DateRangeFilterProps = {
  active?: string;
};

/** Phase 1 UI shell — date filtering wired in Phase 4/5. */
export function DateRangeFilter({ active = "today" }: DateRangeFilterProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
      {RANGES.map((range) => (
        <button
          key={range.id}
          type="button"
          disabled={range.id !== "today"}
          title={range.id !== "today" ? "Coming in Phase 4" : undefined}
          className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${
            active === range.id
              ? "bg-[var(--accent)] text-white"
              : "bg-[var(--surface-2)] text-[var(--muted)] opacity-60"
          }`}
        >
          {range.label}
        </button>
      ))}
    </div>
  );
}
