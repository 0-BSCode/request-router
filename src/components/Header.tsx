import { Link } from "@tanstack/react-router";

import BetterAuthHeader from "#/integrations/better-auth/header-user";

export default function Header() {
  return (
    <header className="border-b px-6 py-4">
      <nav
        aria-label="Main navigation"
        className="mx-auto flex max-w-4xl items-center justify-between gap-4"
      >
        <Link to="/" className="font-semibold">
          Guest request router
        </Link>
        <BetterAuthHeader />
      </nav>
    </header>
  );
}
