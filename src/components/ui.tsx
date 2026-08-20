import { formatLKR } from "@/lib/utils";
import Link from "next/link";

export function Money({ amount, className = "" }: { amount: number; className?: string }) {
  const negative = amount < 0;
  return (
    <span className={`tabular-nums ${negative ? "text-[var(--danger)]" : ""} ${className}`}>
      {negative ? "−" : ""}
      {formatLKR(Math.abs(amount))}
    </span>
  );
}

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="page-title">{title}</h1>
        {description ? <p className="page-sub">{description}</p> : null}
      </div>
      {action ? <div className="flex shrink-0 flex-wrap gap-2">{action}</div> : null}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  accent,
  icon,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  accent?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <div
      className={`card p-4 sm:p-5 ${
        accent ? "border-[var(--accent-muted)] bg-gradient-to-br from-[var(--accent-soft)] to-[var(--surface)]" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="section-title">{label}</p>
        {icon ? <span className="text-lg opacity-60">{icon}</span> : null}
      </div>
      <p className="mt-2 text-2xl font-bold tracking-tight text-[var(--ink)]">{value}</p>
      {hint ? <p className="mt-1.5 text-xs text-[var(--muted)]">{hint}</p> : null}
    </div>
  );
}

export function Card({
  children,
  className = "",
  padding = true,
}: {
  children: React.ReactNode;
  className?: string;
  padding?: boolean;
}) {
  return (
    <div className={`card ${padding ? "p-5" : ""} ${className}`}>{children}</div>
  );
}

export function SectionHeader({
  title,
  href,
  linkLabel = "View all",
}: {
  title: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2 className="text-base font-semibold text-[var(--ink)]">{title}</h2>
      {href ? (
        <Link
          href={href}
          className="text-sm font-medium text-[var(--accent)] hover:text-[var(--accent-hover)]"
        >
          {linkLabel} →
        </Link>
      ) : null}
    </div>
  );
}

export function RecentList({
  items,
  emptyMessage = "Nothing yet.",
}: {
  items: { id: string; date: Date | string; amount: number; detail: string }[];
  emptyMessage?: string;
}) {
  if (!items.length) {
    return (
      <div className="card px-4 py-10 text-center text-sm text-[var(--muted)]">
        {emptyMessage}
      </div>
    );
  }

  return (
    <ul className="card divide-y divide-[var(--line-soft)] overflow-hidden">
      {items.map((item) => (
        <li key={item.id} className="flex items-start justify-between gap-4 px-4 py-3.5 sm:px-5">
          <div className="min-w-0 flex-1">
            <p className="text-sm text-[var(--muted)]">
              {new Date(item.date).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </p>
            <p className="mt-0.5 truncate text-sm text-[var(--ink)]">{item.detail}</p>
          </div>
          <p className="shrink-0 text-sm font-semibold tabular-nums">{formatLKR(item.amount)}</p>
        </li>
      ))}
    </ul>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-dashed border-[var(--line)] bg-[var(--surface-2)] px-6 py-12 text-center">
      <p className="text-sm text-[var(--muted)]">{message}</p>
    </div>
  );
}

export function Label({ children }: { children: React.ReactNode }) {
  return <span className="section-title mb-1.5 block">{children}</span>;
}
