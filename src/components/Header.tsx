import { Link } from "@tanstack/react-router";

import { ThemeToggle } from "#/components/ThemeToggle";
import BetterAuthHeader from "#/integrations/better-auth/header-user";
import { authClient } from "#/lib/auth-client";

// A filled pill marks the current page; aria-current comes from Link.
const navLinkClass =
  "focus-visible:ring-ring inline-block rounded-full px-3.5 py-2 text-sm outline-none focus-visible:ring-2";
const activeLink = { className: "bg-accent text-accent-foreground font-semibold" };
const inactiveLink = { className: "text-muted-foreground hover:text-foreground font-medium" };

export default function Header() {
  const { data: session } = authClient.useSession();
  return (
    <header className="border-b bg-card px-6 py-3">
      <nav
        aria-label="Main navigation"
        className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-3"
      >
        <Link
          to="/"
          activeOptions={{ exact: true }}
          className="flex items-center gap-2.5 font-display text-lg font-semibold tracking-tight"
        >
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
            <circle cx="14" cy="14" r="13" className="stroke-primary" strokeWidth="1.5" />
            <path
              d="M5 17c3-2.5 6-2.5 9 0s6 2.5 9 0"
              className="stroke-primary"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <path
              d="M7 21c2.3-1.8 4.7-1.8 7 0s4.7 1.8 7 0"
              className="stroke-primary"
              strokeWidth="1.5"
              strokeLinecap="round"
              opacity="0.5"
            />
            <circle cx="14" cy="10" r="3" fill="#e0684b" />
          </svg>
          Visayas Beach Resort
        </Link>
        {/* Display only: route beforeLoad checks enforce access. */}
        {session?.user && (
          <ul className="flex items-center gap-1.5">
            <li>
              <Link
                to="/"
                activeOptions={{ exact: true }}
                activeProps={activeLink}
                inactiveProps={inactiveLink}
                className={navLinkClass}
              >
                App
              </Link>
            </li>
            <li>
              <Link
                to="/reference"
                activeProps={activeLink}
                inactiveProps={inactiveLink}
                className={navLinkClass}
              >
                API Reference
              </Link>
            </li>
          </ul>
        )}
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <BetterAuthHeader />
        </div>
      </nav>
    </header>
  );
}
