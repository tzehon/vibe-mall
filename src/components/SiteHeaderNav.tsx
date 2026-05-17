"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import type { AuthUser } from "@/lib/auth";

const navItems = [
  { href: "/create", label: "Create", match: ["/create"] },
  { href: "/mall", label: "Mall", match: ["/mall", "/storefronts"] }
];

type SiteHeaderNavProps = {
  user: AuthUser | null;
};

function isActive(pathname: string, matches: string[]) {
  return matches.some((match) => pathname === match || pathname.startsWith(`${match}/`));
}

export function SiteHeaderNav({ user }: SiteHeaderNavProps) {
  const pathname = usePathname();

  return (
    <nav className="nav-links" aria-label="Main navigation">
      <div className="primary-nav-links">
        {navItems.map((item) => {
          const active = isActive(pathname, item.match);

          return (
            <Link
              aria-current={active ? "page" : undefined}
              className={active ? "active" : undefined}
              key={item.href}
              href={item.href}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
      {user ? (
        <div className="account-cluster">
          <span className="account-chip" title={`Signed in as ${user.email}`}>
            <span>Signed in</span>
            <strong>{user.email}</strong>
          </span>
          <form action="/api/auth/logout" method="post">
            <button className="nav-button" type="submit">
              Logout
            </button>
          </form>
        </div>
      ) : (
        <Link className={pathname === "/login" ? "active" : undefined} href="/login">
          Login
        </Link>
      )}
    </nav>
  );
}
