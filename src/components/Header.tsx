import { Link } from "@tanstack/react-router";

import BetterAuthHeader from "#/integrations/better-auth/header-user";
import { authClient } from "#/lib/auth-client";

// Underline marks the current page; the transparent border keeps link widths and heights stable.
const navLinkClass =
  "focus-visible:ring-ring border-b-2 pb-1 text-sm font-medium outline-none focus-visible:ring-2";
const activeLink = { className: "border-foreground text-foreground" };
const inactiveLink = {
  className: "text-muted-foreground hover:text-foreground border-transparent",
};

export default function Header() {
  const { data: session } = authClient.useSession();
  return (
    <header className="border-b px-6 py-4">
      <nav
        aria-label="Main navigation"
        className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-x-6 gap-y-3"
      >
        <Link to="/" activeOptions={{ exact: true }} className="font-semibold">
          Guest request router
        </Link>
        {/* Display only: route beforeLoad checks enforce access. */}
        {session?.user && (
          <ul className="flex items-center gap-4">
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
        <BetterAuthHeader />
      </nav>
    </header>
  );
}
