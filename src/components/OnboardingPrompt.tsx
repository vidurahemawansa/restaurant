"use client";

import Link from "next/link";

export function OnboardingPrompt({ userName }: { userName: string }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Welcome, {userName.split(" ")[0]} 👋</h1>
        <p className="page-sub">Set up your restaurant to start tracking your business.</p>
      </div>

      <div className="card border-[var(--accent-muted)] bg-gradient-to-br from-[var(--accent-soft)] to-[var(--surface)] p-6">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--accent)] text-2xl text-white">
          🏪
        </div>
        <h2 className="text-lg font-bold">Set up your restaurant</h2>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Add your restaurant name, contact details, and operating hours. You can add your logo
          and photos later from settings.
        </p>
        <Link href="/register/restaurant" className="btn-primary btn-lg mt-6 inline-flex w-full justify-center sm:w-auto">
          Create restaurant
        </Link>
      </div>

      <section className="card p-5">
        <h3 className="section-title mb-3">What you&apos;ll get</h3>
        <ul className="space-y-2 text-sm text-[var(--muted)]">
          <li>• Daily sales &amp; expense dashboard</li>
          <li>• Quick bill, purchase &amp; salary entry</li>
          <li>• Employee &amp; salary tracking</li>
          <li>• Profit, cost &amp; sales analytics (coming soon)</li>
        </ul>
      </section>
    </div>
  );
}
