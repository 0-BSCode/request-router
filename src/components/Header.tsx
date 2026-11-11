import { Link } from "@tanstack/react-router";

export default function Header() {
  return (
    <header className="border-b px-6 py-4">
      <nav aria-label="Main navigation" className="mx-auto max-w-4xl">
        <Link to="/" className="font-semibold">
          Guest request router
        </Link>
      </nav>
    </header>
  );
}
