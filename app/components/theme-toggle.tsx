"use client";

import { useTheme } from "../hooks/use-theme";

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const next = theme === "dark" ? "light" : "dark";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme ? `Switch to ${next} mode` : "Toggle colour theme"}
      title={theme ? `Switch to ${next} mode` : undefined}
      className="btn btn-quiet size-11 px-0 text-lg"
    >
      <span aria-hidden className="dark:hidden">🌙</span>
      <span aria-hidden className="hidden dark:inline">☀️</span>
    </button>
  );
}
