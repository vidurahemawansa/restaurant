"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { AuthUser } from "@/lib/auth/session";

const ADMIN_PRIMARY = [
  { href: "/", label: "Dashboard", icon: "◉" },
  { href: "/sales", label: "Sales", icon: "◎" },
  { href: "/purchases", label: "Purchases", icon: "＋" },
  { href: "/expenses", label: "Expenses", icon: "₨" },
] as const;

const ADMIN_MORE = [
  { href: "/employees", label: "Employees" },
  { href: "/salaries", label: "Salaries" },
  { href: "/purchases/items", label: "Purchase items" },
  { href: "/items", label: "Menu" },
  { href: "/reports/costs", label: "Analytics" },
  { href: "/settings/restaurant", label: "Settings" },
] as const;

const EMPLOYEE_LINKS = [
  { href: "/my", label: "Home", icon: "◉" },
  { href: "/my/salary", label: "Salary", icon: "₨" },
] as const;

const PLATFORM_LINKS = [
  { href: "/platform", label: "Home", icon: "◉" },
  { href: "/platform/restaurants", label: "Restaurants", icon: "🏪" },
  { href: "/platform/users", label: "Users", icon: "👤" },
] as const;

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  if (href === "/my") return pathname === "/my";
  if (href === "/platform") return pathname === "/platform";
  return pathname === href || pathname.startsWith(href + "/");
}

type NavProps = {
  user: AuthUser;
  restaurantName?: string | null;
};

export function Nav({ user, restaurantName }: NavProps) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const isEmployee = user.role === "EMPLOYEE";
  const isSuperAdmin = user.role === "SUPER_ADMIN";
  const isAdmin = !isEmployee && !isSuperAdmin;
  const primary = isSuperAdmin ? PLATFORM_LINKS : isEmployee ? EMPLOYEE_LINKS : ADMIN_PRIMARY;
  const desktopLinks = isSuperAdmin ? PLATFORM_LINKS : isAdmin ? [...ADMIN_PRIMARY, ...ADMIN_MORE] : EMPLOYEE_LINKS;

  const brandLabel = isSuperAdmin
    ? "Platform"
    : isEmployee
      ? user.name.split(" ")[0]
      : restaurantName ?? "My Restaurant";

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-[var(--line-soft)] bg-[var(--surface)]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link href={primary[0].href} className="flex min-w-0 items-center gap-2 font-bold">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--accent)] text-sm text-white">
              K
            </span>
            <span className="truncate text-sm">{brandLabel}</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="hidden text-xs text-[var(--muted)] sm:inline">{user.email}</span>
            <button type="button" onClick={logout} className="btn-ghost text-xs">
              Logout
            </button>
          </div>
        </div>

        {/* Desktop navigation */}
        <div className="hidden border-t border-[var(--line-soft)] md:block">
          <nav className="mx-auto flex max-w-5xl gap-1 overflow-x-auto px-4 py-2 text-sm no-scrollbar">
            {desktopLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`shrink-0 rounded-full px-3 py-1.5 font-medium ${
                  isActive(pathname, link.href)
                    ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                    : "text-[var(--muted)] hover:text-[var(--ink)]"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Mobile secondary nav (admin only) */}
        {isAdmin && (
          <div className="border-t border-[var(--line-soft)] md:hidden">
            <nav className="mx-auto flex max-w-5xl gap-1 overflow-x-auto px-4 py-2 text-sm no-scrollbar">
              {ADMIN_MORE.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`shrink-0 rounded-full px-3 py-1.5 font-medium ${
                    isActive(pathname, link.href)
                      ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                      : "text-[var(--muted)]"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </header>

      {/* Mobile bottom tab bar */}
      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-[var(--line-soft)] bg-[var(--surface)]/95 backdrop-blur-md safe-bottom md:hidden">
        <div className="mx-auto flex max-w-lg">
          {primary.slice(0, 4).map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-xs font-semibold ${
                isActive(pathname, link.href) ? "text-[var(--accent)]" : "text-[var(--muted)]"
              }`}
            >
              <span className="text-lg leading-none">{link.icon}</span>
              {link.label}
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}
