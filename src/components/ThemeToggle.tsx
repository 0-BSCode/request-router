import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

import { Button } from "#/components/ui/button";

// Stores the choice where THEME_INIT_SCRIPT in __root.tsx reads it on the next load.
export function ThemeToggle() {
  // Unknown until mounted: the server cannot see the class the init script applied.
  const [dark, setDark] = useState<boolean | null>(null);
  useEffect(() => setDark(document.documentElement.classList.contains("dark")), []);

  function toggle() {
    const next = dark ? "light" : "dark";
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(next);
    root.setAttribute("data-theme", next);
    root.style.colorScheme = next;
    try {
      localStorage.setItem("theme", next);
    } catch {
      // Storage can be blocked; the switch still applies for this page view.
    }
    setDark(!dark);
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-lg"
      onClick={toggle}
      disabled={dark === null}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      title={dark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {dark ? <Sun aria-hidden /> : <Moon aria-hidden />}
    </Button>
  );
}
